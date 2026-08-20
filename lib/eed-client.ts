// Server-side only — client never sees the e-ed base URL
const EED_BASE = 'https://e-ed.e-tech.ac.th/api';

export async function eedFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  try {
    const res = await fetch(`${EED_BASE}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(options.headers || {}),
      },
    });

    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      const text = await res.text().catch(() => '');
      console.warn(`[eedFetch] non-JSON from ${path} (${res.status}):`, text.slice(0, 100));
      return { success: res.ok, status: res.status, message: 'non_json_response' };
    }

    return await res.json();
  } catch (err: any) {
    console.error(`[eedFetch] error on ${path}:`, err);
    return { success: false, error: err.message || 'fetch_error' };
  }
}
