import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const [
      { rows: [users] },
      { rows: [pendingSlips] },
      { rows: [revenue] },
      { rows: [tasksToday] },
      { rows: [stuckTasks] },
      { rows: chartRows },
      { rows: recentTxs },
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS n FROM users'),
      pool.query("SELECT COUNT(*) AS n FROM slip_uploads WHERE status = 'pending'"),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS n FROM transactions WHERE type = 'topup'"),
      pool.query("SELECT COUNT(*) AS n FROM paid_tasks WHERE DATE(paid_at) = CURRENT_DATE"),
      pool.query('SELECT COUNT(*) AS n FROM paid_tasks WHERE ran_at IS NULL'),
      pool.query(`
        SELECT
          TO_CHAR(DATE(created_at AT TIME ZONE 'Asia/Bangkok'), 'YYYY-MM-DD') AS date,
          SUM(amount) AS total
        FROM transactions
        WHERE type = 'topup'
          AND created_at >= NOW() - INTERVAL '6 days'
        GROUP BY DATE(created_at AT TIME ZONE 'Asia/Bangkok')
        ORDER BY date ASC
      `),
      pool.query(`
        SELECT id, student_id, type, amount, description, status, created_at
        FROM transactions
        ORDER BY created_at DESC
        LIMIT 10
      `),
    ]);

    // Fill gaps so every day in last 7 has a value (Bangkok timezone)
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const chartMap: Record<string, number> = {};
    (chartRows as { date: string; total: string }[]).forEach(r => {
      chartMap[r.date] = Number(r.total);
    });

    return Response.json({
      stats: {
        total_revenue: Number((revenue as { n: string }).n),
        pending_slips: Number((pendingSlips as { n: string }).n),
        total_users:   Number((users as { n: string }).n),
        tasks_today:   Number((tasksToday as { n: string }).n),
        stuck_tasks:   Number((stuckTasks as { n: string }).n),
      },
      revenue_chart: last7.map(date => ({ date, total: chartMap[date] ?? 0 })),
      recent_transactions: recentTxs,
    });
  } catch (err) {
    console.error('[dashboard] error:', err);
    return Response.json({ error: 'db_error', detail: String(err) }, { status: 500 });
  }
}
