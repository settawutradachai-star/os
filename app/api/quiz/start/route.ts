import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const queryToken = searchParams.get('token');
  const cookieToken = cookies().get('eed_token')?.value;
  const token = queryToken || cookieToken;

  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const itemId = searchParams.get('itemId') || searchParams.get('itemid') || '';
  if (!itemId) return Response.json({ error: 'missing_itemId' }, { status: 400 });

  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/quiz/v2/${itemId}/start?token=${token}`,
    {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return Response.json({ error: 'invalid_response_from_eed' }, { status: 502 });
  }

  return Response.json(await res.json());
}
