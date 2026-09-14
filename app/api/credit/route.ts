import pool from '@/lib/db';

export async function POST(req: Request) {
  const { student_id, course_id } = await req.json();
  if (!student_id) return Response.json({ error: 'missing student_id' }, { status: 400 });

  try {
    const { rows: settingsRows } = await pool.query(
      "SELECT key_name, value FROM settings WHERE key_name IN ('price_per_task','price_per_task_reseller','maintenance_mode')"
    );
    const cfg: Record<string, string> = {};
    (settingsRows as { key_name: string; value: string }[]).forEach(r => { cfg[r.key_name] = r.value; });
    const maintenance         = cfg['maintenance_mode'] === '1';
    const pricePerTask        = parseFloat(cfg['price_per_task']          ?? '1')    || 1;
    const pricePerTaskReseller = parseFloat(cfg['price_per_task_reseller'] ?? '0.50') || 0.50;

    await pool.query(
      'INSERT INTO users (student_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [student_id]
    );

    const { rows: users } = await pool.query(
      'SELECT credit_balance FROM users WHERE student_id = $1',
      [student_id]
    );
    const balance = Number((users[0] as { credit_balance: number } | undefined)?.credit_balance ?? 0);

    let paidItems: string[] = [];
    let everPaidItems: string[] = [];
    if (course_id) {
      const [{ rows: pendingRows }, { rows: everRows }] = await Promise.all([
        pool.query(
          'SELECT itemid FROM paid_tasks WHERE student_id = $1 AND course_id = $2 AND ran_at IS NULL',
          [student_id, course_id]
        ),
        pool.query(
          'SELECT itemid FROM paid_tasks WHERE student_id = $1 AND course_id = $2',
          [student_id, course_id]
        ),
      ]);
      paidItems = (pendingRows as { itemid: string }[]).map(r => String(r.itemid));
      everPaidItems = (everRows as { itemid: string }[]).map(r => String(r.itemid));
    }

    const { rows: history } = await pool.query(
      'SELECT type, status, amount, created_at, description FROM transactions WHERE student_id = $1 ORDER BY created_at DESC LIMIT 20',
      [student_id]
    );

    return Response.json({
      balance,
      price_per_task: pricePerTask,
      price_per_task_reseller: pricePerTaskReseller,
      paid_items: paidItems,
      ever_paid_items: everPaidItems,
      maintenance,
      history,
    });

  } catch (err) {
    console.error('[credit]', err);
    return Response.json({ balance: 0, price_per_task: 1, paid_items: [], ever_paid_items: [], maintenance: false, history: [] });
  }
}
