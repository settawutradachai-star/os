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

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: base64Image }),
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
