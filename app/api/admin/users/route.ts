import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { rows } = await pool.query(
      "SELECT student_id, credit_balance, COALESCE(role, 'user') AS role, created_at FROM users ORDER BY created_at DESC"
    );
    return Response.json({ users: rows });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return Response.json({ error: 'db_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { action, student_id, amount, role } = await req.json();

  if (!student_id) return Response.json({ error: 'missing student_id' }, { status: 400 });

  try {
    if (action === 'add_credit') {
      await pool.query(
        'UPDATE users SET credit_balance = credit_balance + $1 WHERE student_id = $2',
        [Number(amount), student_id]
      );
      await pool.query(
        "INSERT INTO transactions (student_id, type, amount, description, status) VALUES ($1, 'topup', $2, 'Admin เพิ่มเครดิต', 'completed')",
        [student_id, Number(amount)]
      );
      return Response.json({ success: true });
    }

    if (action === 'set_role') {
      const safeRole = ['user', 'admin', 'reseller'].includes(role) ? role : 'user';
      await pool.query('UPDATE users SET role = $1 WHERE student_id = $2', [safeRole, student_id]);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'unknown_action' }, { status: 400 });
  } catch (err) {
    console.error('[admin/users PATCH]', err);
    return Response.json({ error: 'db_error' }, { status: 500 });
  }
}
