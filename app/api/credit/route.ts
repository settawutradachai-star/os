import pool from '@/lib/db';

export async function POST(req: Request) {
  const { student_id, course_id } = await req.json();
  if (!student_id) return Response.json({ error: 'missing student_id' }, { status: 400 });

  try {
    const { rows: settingsRows } = await pool.query(
      "SELECT key_name, value FROM settings WHERE key_name IN ('price_per_task','maintenance_mode')"
    );
    const cfg: Record<string, string> = {};
    (settingsRows as { key_name: string; value: string }[]).forEach(r => { cfg[r.key_name] = r.value; });
    const maintenance  = cfg['maintenance_mode'] === '1';
    const pricePerTask = parseFloat(cfg['price_per_task'] ?? '1') || 1;

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
    if (course_id) {
      const { rows } = await pool.query(
        'SELECT itemid FROM paid_tasks WHERE student_id = $1 AND course_id = $2 AND ran_at IS NULL',
        [student_id, course_id]
      );
      paidItems = (rows as { itemid: string }[]).map(r => r.itemid);
    }

    const { rows: history } = await pool.query(
      'SELECT type, status, amount, created_at, description FROM transactions WHERE student_id = $1 ORDER BY created_at DESC LIMIT 20',
      [student_id]
    );

    return Response.json({ balance, price_per_task: pricePerTask, paid_items: paidItems, maintenance, history });

  } catch (err) {
    console.error('[credit]', err);
    return Response.json({ balance: 0, price_per_task: 1, paid_items: [], maintenance: false, history: [] });
  }
}
