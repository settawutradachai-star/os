import pool from '@/lib/db';

export async function POST(req: Request) {
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
  const loginRes = await fetch(
    `https://e-ed.e-tech.ac.th/api/login?username=${encodeURIComponent(customer_student_id)}&password=${encodeURIComponent(customer_password)}&app_type=browser`,
    { method: 'POST' }
  );
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
}
