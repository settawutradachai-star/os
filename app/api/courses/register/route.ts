export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token = '', host_id = 1, open_id } = body;
    const courseId = body.courseid ?? body.course_id;

    if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

    const res = await fetch(
      `https://e-ed.e-tech.ac.th/api/course/${courseId}/register`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ host_id, open_id, courseid: courseId }),
      }
    );

    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      return Response.json({ success: res.ok, status: res.status });
    }

    return Response.json(await res.json());
  } catch (err: any) {
    console.error('[courses/register] error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
