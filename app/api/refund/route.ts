import pool from '@/lib/db';

export async function POST(req: Request) {
  const { student_id, course_id, item_ids } = await req.json();

  if (!student_id || !Array.isArray(item_ids) || item_ids.length === 0) {
    return Response.json({ success: false, error: 'missing_parameters' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: settingRows } = await client.query(
      "SELECT value FROM settings WHERE key_name = 'price_per_task' LIMIT 1"
    );
    const pricePerTask = parseFloat((settingRows[0] as { value: string } | undefined)?.value ?? '1') || 1;

    // Delete only entries that haven't been run yet (ran_at IS NULL)
    const { rows: deletedRows } = await client.query(
      'DELETE FROM paid_tasks WHERE student_id = $1 AND course_id = $2 AND itemid = ANY($3::int[]) AND ran_at IS NULL RETURNING itemid',
      [student_id, Number(course_id ?? 0), item_ids.map(Number)]
    );

    const refundCount = deletedRows.length;
    if (refundCount === 0) {
      await client.query('COMMIT');
      return Response.json({ success: true, refunded: 0, refund_amount: 0 });
    }

    const refundAmount = pricePerTask * refundCount;

    await client.query(
      'UPDATE users SET credit_balance = credit_balance + $1 WHERE student_id = $2',
      [refundAmount, student_id]
    );
    await client.query(
      "INSERT INTO transactions (student_id, type, amount, description, status) VALUES ($1, 'refund', $2, $3, 'completed')",
      [student_id, refundAmount, `Refund: ${refundCount} items (nothing to do)`]
    );

    await client.query('COMMIT');

    const { rows: userRows } = await pool.query(
      'SELECT credit_balance FROM users WHERE student_id = $1',
      [student_id]
    );
    const newBalance = Number((userRows[0] as { credit_balance: number } | undefined)?.credit_balance ?? 0);

    return Response.json({ success: true, refunded: refundCount, refund_amount: refundAmount, new_balance: newBalance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[refund]', err);
    return Response.json({ success: false, error: 'server_error' }, { status: 500 });
  } finally {
    client.release();
  }
}
