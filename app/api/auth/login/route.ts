import pool from '@/lib/db';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&app_type=browser`,
    { method: 'POST' }
  );
  const data = await res.json();

  if (!data.success || !data.token) {
    await new Promise(r => setTimeout(r, 1500));
    return Response.json({ success: false, message: data.message ?? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  // Upsert user so they always exist in DB (preserves existing role/balance)
  let role = 'user';
  try {
    await pool.query(
      'INSERT INTO users (student_id) VALUES ($1) ON CONFLICT (student_id) DO NOTHING',
      [data.username]
    );
    const { rows } = await pool.query(
      "SELECT COALESCE(role, 'user') AS role FROM users WHERE student_id = $1",
      [data.username]
    );
    if (rows.length > 0) role = rows[0].role;

  } catch (err) {
    console.error('[login] DB error fetching role:', err);
  }

  return Response.json({ ...data, role });
}
