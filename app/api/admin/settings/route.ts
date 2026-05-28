import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

const DEFAULT_SETTINGS = [
  { key_name: 'BANK_NAME',         value: process.env.BANK_NAME         ?? '' },
  { key_name: 'BANK_ACCOUNT_NO',   value: process.env.BANK_ACCOUNT_NO   ?? '' },
  { key_name: 'BANK_ACCOUNT_NAME', value: process.env.BANK_ACCOUNT_NAME ?? '' },
  { key_name: 'PRICE_PER_ITEM',    value: '1' },
];

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT key_name, value FROM settings ORDER BY key_name');
    if (rows.length === 0) return Response.json({ settings: DEFAULT_SETTINGS });
    return Response.json({ settings: rows });
  } catch {
    return Response.json({ settings: DEFAULT_SETTINGS });
  }
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { key_name, value } = await req.json();
  if (!key_name) return Response.json({ error: 'missing key_name' }, { status: 400 });

  try {
    await pool.query(
      'INSERT INTO settings (key_name, value) VALUES ($1, $2) ON CONFLICT (key_name) DO UPDATE SET value = EXCLUDED.value',
      [key_name, value]
    );
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'db_error' }, { status: 500 });
  }
}
