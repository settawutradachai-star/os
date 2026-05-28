// Server-side only — client never sees the e-ed base URL
const EED_BASE = 'https://e-ed.e-tech.ac.th/api';

export async function eedFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${EED_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res.json();
}
