import { eedFetch } from '@/lib/eed-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token     = searchParams.get('token')     ?? '';
  const course_id = searchParams.get('course_id') ?? '';
  const recid     = searchParams.get('recid')     ?? '';

  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const data = await eedFetch(`/course/${course_id}/v2Items?recid=${recid}`, token);
  return Response.json(data);
}
