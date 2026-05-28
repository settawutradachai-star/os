export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token   = searchParams.get('token')   ?? '';
  const year    = searchParams.get('year')    ?? '';
  const term    = searchParams.get('term')    ?? '';
  const id_code = searchParams.get('id_code') ?? '';

  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/courses?year=${encodeURIComponent(year)}&term=${encodeURIComponent(term)}&id_code=${encodeURIComponent(id_code)}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  return Response.json(await res.json());
}
