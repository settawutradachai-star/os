import { createHash } from 'crypto';

export function todayAdminToken(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return createHash('sha256').update((process.env.ADMIN_PASSWORD ?? '') + today).digest('hex');
}

export function requireAdmin(req: Request): boolean {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token.length > 0 && token === todayAdminToken();
}
