import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
    }

    const res = await fetch('https://e-ed.e-tech.ac.th/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ username, password, app_type: 'browser' }),
    });

    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      if (res.status === 429) {
        return Response.json(
          { success: false, message: 'ระบบ e-ED ป้องกันการล็อกอินถี่เกินไป กรุณารอประมาณ 15-30 วินาทีแล้วลองใหม่อีกครั้ง' },
          { status: 429 }
        );
      }
      return Response.json(
        { success: false, message: 'ระบบ e-ED ปลายทางไม่ตอบสนอง กรุณาลองใหม่อีกครั้ง' },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.success || !data.token) {
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
  } catch (err: any) {
    console.error('[login] Exception in login route:', err);
    return Response.json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
