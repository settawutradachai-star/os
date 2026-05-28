import pool from '@/lib/db';
import { todayAdminToken } from '@/lib/admin-auth';

export async function POST(req: Request) {
  const { password, student_id } = await req.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!student_id) {
    return Response.json({ error: 'student_id required' }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      "SELECT role FROM users WHERE student_id = $1",
      [student_id]
    );
    if (!rows[0] || rows[0].role !== 'admin') {
      return Response.json({ error: 'forbidden — admin role required' }, { status: 403 });
    }
  } catch {
    return Response.json({ error: 'db_error' }, { status: 500 });
  }

  return Response.json({ success: true, token: todayAdminToken() });
}

export async function GET(req: Request) {
  const auth  = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return Response.json({ authenticated: token === todayAdminToken() });
}
