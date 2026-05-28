import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  const expired  = 'HttpOnly; Path=/; SameSite=Strict; Max-Age=0';
  response.headers.append('Set-Cookie', `eed_token=; ${expired}`);
  response.headers.append('Set-Cookie', `eed_username=; ${expired}`);
  response.headers.append('Set-Cookie', `eed_id_code=; ${expired}`);
  response.headers.append('Set-Cookie', `admin_token=; ${expired}`);
  return response;
}
