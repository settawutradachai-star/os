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

  return Response.json(data);
}
