import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { customer_student_id, customer_password, reseller_student_id } = await req.json();

    if (!customer_student_id || !customer_password || !reseller_student_id) {
      return Response.json({ success: false, message: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    // Verify reseller role
    try {
      const { rows } = await pool.query(
        "SELECT role FROM users WHERE student_id = $1",
        [reseller_student_id]
      );
      if (!rows.length || rows[0].role !== 'reseller') {
        return Response.json({ success: false, message: 'บัญชีนี้ไม่มีสิทธิ์ reseller' }, { status: 403 });
      }
    } catch (err) {
      console.error('[reseller/login] db error:', err);
      return Response.json({ success: false, message: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }

    // Login to e-ed with customer credentials
    const loginRes = await fetch('https://e-ed.e-tech.ac.th/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        username: customer_student_id,
        password: customer_password,
        app_type: 'browser',
      }),
    });

    const ct = loginRes.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      if (loginRes.status === 429) {
        return Response.json(
          { success: false, message: 'ระบบ e-ED ล็อกอินถี่เกินไป กรุณารอ 15-30 วินาทีแล้วลองใหม่' },
          { status: 429 }
        );
      }
      return Response.json({ success: false, message: 'ระบบ e-ED ไม่ตอบสนอง' }, { status: 502 });
    }

    const loginData = await loginRes.json();

    if (!loginData.success || !loginData.token) {
      return Response.json({ success: false, message: 'รหัสนักศึกษาหรือรหัสผ่านลูกค้าไม่ถูกต้อง' }, { status: 401 });
    }

    return Response.json({
      success:    true,
      token:      loginData.token,
      student_id: loginData.username,
      year:       loginData.default_year_term?.th_year,
      term:       loginData.default_year_term?.term,
    });
  } catch (err: any) {
    console.error('[reseller/login] Exception:', err);
    return Response.json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' }, { status: 500 });
  }
}
