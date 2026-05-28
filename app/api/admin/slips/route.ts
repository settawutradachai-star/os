import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { rows } = await pool.query(
      `SELECT id, student_id, amount, status, created_at
       FROM slip_uploads
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return Response.json({ slips: rows });
  } catch {
    return Response.json({ error: 'db_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const { status } = await req.json();

  if (!id || !['approved', 'rejected'].includes(status)) {
    return Response.json({ error: 'invalid' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT student_id, amount FROM slip_uploads WHERE id = $1 AND status = $2',
      [id, 'pending']
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return Response.json({ error: 'not found' }, { status: 404 });
    }

    await client.query('UPDATE slip_uploads SET status = $1 WHERE id = $2', [status, id]);

    if (status === 'approved') {
      const { student_id, amount } = rows[0] as { student_id: string; amount: number };
      await client.query(
        'UPDATE users SET credit_balance = credit_balance + $1 WHERE student_id = $2',
        [amount, student_id]
      );
      await client.query(
        "INSERT INTO transactions (student_id, type, amount, description, status) VALUES ($1, 'topup', $2, $3, 'completed')",
        [student_id, amount, `Admin approved slip #${id}`]
      );
    }

    await client.query('COMMIT');
    return Response.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return Response.json({ error: 'db_error' }, { status: 500 });
  } finally {
    client.release();
  }
}
