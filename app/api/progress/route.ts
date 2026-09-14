import { cookies } from 'next/headers';
import { eedFetch } from '@/lib/eed-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token: bodyToken, ...progressData } = body;

    const cookieToken = cookies().get('eed_token')?.value;
    const authToken = bodyToken || cookieToken;

    if (!authToken) return Response.json({ error: 'unauthorized' }, { status: 401 });

    const data = await eedFetch('/setLearnProgress', authToken, {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
    return Response.json(data);
  } catch (err: any) {
    console.error('[progress] error:', err);
    return Response.json({ success: false, error: err.message }, { status: 200 });
  }
}
