export async function verifySlip(
  base64Image: string
): Promise<{ valid: boolean; amount: number; ref?: string }> {
  const apiKey   = process.env.SLIPOK_API_KEY;
  const branchId = process.env.SLIPOK_BRANCH_ID;
  const endpoint = process.env.SLIPOK_ENDPOINT;

  if (!apiKey || !branchId || !endpoint) {
    console.error('[slipok] missing env vars — SLIPOK_API_KEY:', !!apiKey, 'SLIPOK_BRANCH_ID:', !!branchId, 'SLIPOK_ENDPOINT:', !!endpoint);
    return { valid: false, amount: 0 };
  }

  const url = `${endpoint}${branchId}`;
  console.log('[slipok] calling:', url);

  const buffer = Buffer.from(base64Image, 'base64');
  const blob   = new Blob([buffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('files', blob, 'slip.jpg');
  formData.append('log', 'true');

  console.log('[slipok] sending as multipart/form-data, buffer size:', buffer.length);
  console.log('[slipok] headers:', { 'x-authorization': apiKey.substring(0, 5) + '...' });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-authorization': apiKey,
      // Content-Type intentionally omitted — fetch sets multipart boundary automatically
    },
    body: formData,
  });

  console.log('[slipok] status:', res.status);

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    console.error('[slipok] non-JSON response:', text.slice(0, 200));
    return { valid: false, amount: 0 };
  }

  const data = await res.json();
  console.log('[slipok] response:', JSON.stringify(data));

  if (!data.success) {
    console.warn('[slipok] verification failed:', data.code, data.message);
    return { valid: false, amount: 0 };
  }

  return {
    valid:  true,
    amount: Number(data.data?.amount ?? 0),
    ref:    data.data?.transRef,
  };
}
