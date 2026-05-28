export async function verifySlip(
  base64Image: string
): Promise<{ valid: boolean; amount: number; ref?: string }> {
  const apiKey   = process.env.SLIPOK_API_KEY!;
  const branchId = process.env.SLIPOK_BRANCH_ID!;
  const endpoint = process.env.SLIPOK_ENDPOINT!;

  const res = await fetch(`${endpoint}${branchId}`, {
    method: 'POST',
    headers: {
      'x-authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: base64Image }),
  });

  const data = await res.json();

  if (!data.success) {
    return { valid: false, amount: 0 };
  }

  return {
    valid:  true,
    amount: Number(data.data?.amount ?? 0),
    ref:    data.data?.transRef,
  };
}
