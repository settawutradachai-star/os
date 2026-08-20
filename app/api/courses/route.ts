export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token   = searchParams.get('token')   ?? '';
    const year    = searchParams.get('year')    ?? '';
    const term    = searchParams.get('term')    ?? '';
    const id_code = searchParams.get('id_code') ?? '';

    if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

    const res = await fetch(
      `https://e-ed.e-tech.ac.th/api/courses?year=${encodeURIComponent(year)}&term=${encodeURIComponent(term)}&id_code=${encodeURIComponent(id_code)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );

    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      return Response.json({ subjects: [], error: 'non_json' }, { status: res.status });
    }

    return Response.json(await res.json());
  } catch (err: any) {
    console.error('[courses] error:', err);
    return Response.json({ subjects: [], error: err.message }, { status: 500 });
  }
}
