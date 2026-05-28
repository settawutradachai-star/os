import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { rows } = await pool.query(
      "SELECT student_id, credit_balance, COALESCE(role, 'user') AS role, created_at FROM users ORDER BY created_at DESC"
    );
    return Response.json({ users: rows });
  } catch {
    return Response.json({ error: 'db_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'set_role') {
    const student_id = String(body.student_id ?? '').trim();
    const role = ['user', 'admin'].includes(body.role) ? body.role : 'user';
    if (!student_id) return Response.json({ error: 'missing student_id' }, { status: 400 });
    try {
      await pool.query('UPDATE users SET role = $1 WHERE student_id = $2', [role, student_id]);
      return Response.json({ success: true });
    } catch {
      return Response.json({ error: 'db_error' }, { status: 500 });
    }
  }

  const { student_id, credit_balance } = body;
  if (!student_id) return Response.json({ error: 'missing student_id' }, { status: 400 });

  try {
    await pool.query('UPDATE users SET credit_balance = $1 WHERE student_id = $2', [credit_balance, student_id]);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'db_error' }, { status: 500 });
  }
}
