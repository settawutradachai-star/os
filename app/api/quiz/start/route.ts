import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const token = cookies().get('eed_token')?.value;
  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId') ?? '';

  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/quiz/v2/${itemId}/start?token=${token}`,
    { method: 'GET' }
  );
  return Response.json(await res.json());
}
