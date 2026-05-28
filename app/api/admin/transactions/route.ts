import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { rows } = await pool.query(
      `SELECT id, student_id, type, amount, description, status, created_at
       FROM transactions
       ORDER BY created_at DESC
       LIMIT 200`
    );
    return Response.json({ transactions: rows });
  } catch {
    return Response.json({ error: 'db_error' }, { status: 500 });
  }
}
