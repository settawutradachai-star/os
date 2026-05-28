export async function POST() {
  return Response.json({
    bank_name: process.env.BANK_NAME || '—',
    account_no: process.env.BANK_ACCOUNT_NO || '—',
    account_name: process.env.BANK_ACCOUNT_NAME || '—',
    qr_image: process.env.QR_CODE_IMAGE || '',
  });
}
