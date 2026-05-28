export async function POST(req: Request) {
  const body                          = await req.json();
  const { token = '', host_id = 1, open_id } = body;
  const courseId                      = body.courseid ?? body.course_id;

  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/course/${courseId}/register`,
    {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ host_id, open_id, courseid: courseId }),
    }
  );
  return Response.json(await res.json());
}
