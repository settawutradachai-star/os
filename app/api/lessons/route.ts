import { cookies } from 'next/headers';
import { eedFetch } from '@/lib/eed-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemid     = searchParams.get('itemid') ?? '';
  const recid      = searchParams.get('recid') ?? '';
  const tokenParam = searchParams.get('token') ?? '';

  const cookieToken = cookies().get('eed_token')?.value;
  const authToken   = tokenParam || cookieToken;

  if (!authToken) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const data = await eedFetch(`/item/${itemid}/lessons?recid=${recid}`, authToken);
  return Response.json(data);
}
