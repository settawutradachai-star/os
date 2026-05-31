import pool from '@/lib/db';

export async function POST(req: Request) {
  const { student_id, course_id, item_ids, reseller_student_id } = await req.json();

  if (!student_id || !Array.isArray(item_ids) || item_ids.length === 0) {
    return Response.json({ success: false, error: 'missing_parameters' }, { status: 400 });
  }

  const intIds    = item_ids.map(Number);
  const courseInt = Number(course_id ?? 0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Billing: if reseller_student_id provided, charge reseller at reseller price
    const billing_id = reseller_student_id || student_id;
    const priceKey   = reseller_student_id ? 'price_per_task_reseller' : 'price_per_task';

    const { rows: settingRows } = await client.query(
      'SELECT value FROM settings WHERE key_name = $1 LIMIT 1',
      [priceKey]
    );
    const pricePerTask = parseFloat((settingRows[0] as { value: string } | undefined)?.value ?? '1') || 1;

    // Filter out items already paid but not yet run (prevent double charge)
    const { rows: alreadyRows } = await client.query(
      'SELECT itemid FROM paid_tasks WHERE student_id = $1 AND course_id = $2 AND itemid = ANY($3::int[]) AND ran_at IS NULL',
      [student_id, courseInt, intIds]
    );
    const alreadyPaidIds = alreadyRows.map((r: any) => Number(r.itemid));
    const newItemIds     = intIds.filter(id => !alreadyPaidIds.includes(id));
    const totalCost      = pricePerTask * newItemIds.length;

    let currentBalance = 0;

    if (newItemIds.length > 0) {
      const { rows: userRows } = await client.query(
        'SELECT credit_balance FROM users WHERE student_id = $1',
        [billing_id]
      );

      if (!userRows.length) {
        await client.query('ROLLBACK');
        return Response.json({ success: false, error: 'user_not_found' });
      }

      currentBalance = Number((userRows[0] as { credit_balance: number }).credit_balance);

      if (currentBalance < totalCost) {
        await client.query('ROLLBACK');
        return Response.json({
          success:  false,
          error:    'insufficient_credit',
          required: totalCost,
          balance:  currentBalance,
          shortage: totalCost - currentBalance,
        });
      }

      await client.query(
        'UPDATE users SET credit_balance = credit_balance - $1 WHERE student_id = $2 AND credit_balance >= $3',
        [totalCost, billing_id, totalCost]
      );

      for (const itemId of newItemIds) {
        await client.query(
          'INSERT INTO paid_tasks (student_id, course_id, itemid) VALUES ($1, $2, $3) ON CONFLICT (student_id, course_id, itemid) DO NOTHING',
          [student_id, courseInt, itemId]
        );
      }

      const txDesc = reseller_student_id
        ? `Auto: ${newItemIds.length} items (customer: ${student_id})`
        : `Auto: ${newItemIds.length} items`;
      await client.query(
        "INSERT INTO transactions (student_id, type, amount, description, status) VALUES ($1, 'spend', $2, $3, 'completed')",
        [billing_id, totalCost, txDesc]
      );
    } else {
      const { rows: userRows } = await client.query(
        'SELECT credit_balance FROM users WHERE student_id = $1',
        [billing_id]
      );
      currentBalance = Number((userRows[0] as { credit_balance: number } | undefined)?.credit_balance ?? 0);
    }

    await client.query('COMMIT');

    return Response.json({
      success:     true,
      new_balance: newItemIds.length > 0 ? currentBalance - totalCost : currentBalance,
      charged:     totalCost,
      paid_items:  [...alreadyPaidIds, ...newItemIds],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[spend]', err);
    return Response.json({ success: false, error: 'server_error' }, { status: 500 });
  } finally {
    client.release();
  }
}
