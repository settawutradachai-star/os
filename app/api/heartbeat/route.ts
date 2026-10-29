const HEARTBEAT_URL = 'https://e-ed.e-tech.ac.th/heartbeat';
const EED_ORIGIN = 'https://e-ed.e-tech.ac.th';

function parseSetCookies(headers: Headers): string[] {
  // Node/Next may expose combined Set-Cookie or getSetCookie depending on runtime.
  const anyHeaders = headers as Headers & { getSetCookie?: () => string[] };
  const direct = anyHeaders.getSetCookie?.();
  if (direct?.length) return direct;

  const raw = headers.get('set-cookie');
  if (!raw) return [];
  // Cookie attributes can contain commas, so only split before a new cookie name.
  return raw.split(/,(?=\s*[A-Za-z0-9_\-]+=[^;]+)/g);
}

function cookiePair(setCookie: string): string {
  return setCookie.split(';', 1)[0].trim();
}

function getCookie(cookieHeader: string, name: string): string | null {
  const found = cookieHeader
    .split(';')
    .map(v => v.trim())
    .find(v => v.startsWith(`${name}=`));
  return found ? found.slice(name.length + 1) : null;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = 18000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// Retry only safe session-bootstrap GETs. Do not automatically replay POSTs,
// because the upstream may have processed a heartbeat before a connection error.
async function bootstrapGet(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetchWithTimeout(url, init, 18000);
      if (response.status >= 500 && attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 800));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 800));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('E-ED session bootstrap failed');
}

async function bootstrapEedSession(): Promise<{ cookie: string; xsrf: string | null }> {
  // /heartbeat is a Laravel-style web endpoint and may require a CSRF/session
  // cookie even though the application API itself uses a Bearer token.
  const boot = await bootstrapGet(HEARTBEAT_URL, {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/json,application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
  });

  let pairs = parseSetCookies(boot.headers).map(cookiePair).filter(Boolean);

  // Some deployments initialize the Laravel session on the site root instead.
  if (!pairs.some(c => c.startsWith('XSRF-TOKEN='))) {
    const root = await bootstrapGet(EED_ORIGIN + '/', {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });
    pairs = pairs.concat(parseSetCookies(root.headers).map(cookiePair).filter(Boolean));
  }

  const cookie = Array.from(new Set(pairs)).join('; ');
  const xsrf = getCookie(cookie, 'XSRF-TOKEN');
  return { cookie, xsrf };
}

async function postHeartbeat(payload: Record<string, unknown>, token?: string) {
  const { cookie, xsrf } = await bootstrapEedSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    Origin: EED_ORIGIN,
    Referer: EED_ORIGIN + '/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36',
  };

  if (cookie) headers.Cookie = cookie;
  if (xsrf) headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf);
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetchWithTimeout(HEARTBEAT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  }, 20000);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, ...payload } = body ?? {};

    const res = await postHeartbeat(payload, token);
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: res.ok, status: res.status, raw: text };
    }

    console.log('[heartbeat] upstream', {
      status: res.status,
      lessonid: payload?.lessonid,
      itemid: payload?.itemid,
      recid: payload?.recid,
      lesson_type: payload?.lesson_type,
      success: data?.success,
      percent: data?.percent,
      item_complete: data?.item_complete,
    });
    const headers = new Headers();
    const retryAfter = res.headers.get('retry-after');
    if (retryAfter) headers.set('Retry-After', retryAfter);
    return Response.json(data, { status: res.status, headers });
  } catch (err: any) {
    console.error('[heartbeat] error:', err);
    return Response.json(
      { success: false, error: err?.message || 'heartbeat_error' },
      { status: 502 }
    );
  }
}
