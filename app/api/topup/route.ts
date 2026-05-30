import pool from '@/lib/db';
import { verifySlip } from '@/lib/slipok';

export async function POST(req: Request) {
  console.log('[topup] start');
  try {
    const formData = await req.formData();
    const student_id = formData.get('student_id')?.toString();
    const slipFile = formData.get('slip') as File | null;

    console.log('[topup] student_id:', student_id);
    console.log('[topup] slip file:', slipFile?.name, slipFile?.size, 'bytes');

    if (!student_id || !slipFile) {
      console.warn('[topup] missing student_id or slip');
      return Response.json({ message: 'Missing student_id or slip' }, { status: 400 });
    }

    console.log('[topup] SLIPOK_API_KEY:', process.env.SLIPOK_API_KEY ? 'SET' : 'MISSING');
    console.log('[topup] SLIPOK_BRANCH_ID:', process.env.SLIPOK_BRANCH_ID ? 'SET' : 'MISSING');
    console.log('[topup] SLIPOK_ENDPOINT:', process.env.SLIPOK_ENDPOINT ? 'SET' : 'MISSING');

    const buffer = await slipFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    console.log('[topup] base64 length:', base64.length);
    console.log('[topup] base64 prefix:', base64.substring(0, 100));
    console.log('[topup] starts with data:image?', base64.startsWith('data:image'));
    console.log('[topup] starts with /9j/ (JPEG)?', base64.startsWith('/9j/'));
    console.log('[topup] starts with iVBORw (PNG)?', base64.startsWith('iVBORw'));

    console.log('[topup] calling SlipOK...');
    const result = await verifySlip(base64);
    console.log('[topup] SlipOK result:', JSON.stringify(result));

    if (!result.valid) {
      return Response.json({
        status: 'rejected',
        message: 'สลิปไม่ถูกต้องหรือไม่สามารถตรวจสอบได้',
      });
    }

    const amount = result.amount;
    console.log('[topup] verified amount:', amount, 'ref:', result.ref);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'INSERT INTO users (student_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [student_id]
      );

      await client.query(
        'UPDATE users SET credit_balance = credit_balance + $1 WHERE student_id = $2',
        [amount, student_id]
      );

      await client.query(
        'INSERT INTO transactions (student_id, type, amount, description, status) VALUES ($1, $2, $3, $4, $5)',
        [student_id, 'topup', amount, `SlipOK ref: ${result.ref ?? 'n/a'}`, 'completed']
      );

      await client.query(
        'INSERT INTO slip_uploads (student_id, amount, status) VALUES ($1, $2, $3)',
        [student_id, amount, 'approved']
      );

      await client.query('COMMIT');

      const { rows } = await pool.query(
        'SELECT credit_balance FROM users WHERE student_id = $1',
        [student_id]
      );
      const newBalance = Number(rows[0]?.credit_balance ?? 0);
      console.log('[topup] done — new balance for', student_id, ':', newBalance);

      return Response.json({
        status: 'approved',
        success: true,
        message: `เติมเงินสำเร็จ ฿${amount}`,
        new_balance: newBalance,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[topup] ERROR:', err);
    return Response.json({
      status: 'error',
      message: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      error: String(err),
    }, { status: 500 });
  }
}
