# Blueberry — Next.js Rewrite

## ชื่อแอป
**Blueberry** — ใช้ชื่อนี้ทุกที่:
- `<title>Blueberry</title>` ใน layout.tsx
- Logo/navbar แสดงชื่อ "Blueberry"
- `name` ใน package.json: `"name": "blueberry"`
- favicon ใช้ emoji 🫐 หรือสี indigo/purple

---

## ⚠️ CRITICAL — UI ต้องเหมือนเดิม 100%

**ห้าม redesign UI เด็ดขาด** — copy HTML + Tailwind classes จากไฟล์ PHP เดิมมาใส่ใน JSX ตรงๆ เปลี่ยนแค่ syntax เท่านั้น

| PHP เดิม | Next.js ใหม่ |
|----------|-------------|
| `login.php` | `app/login/page.tsx` |
| `index.php` | `app/courses/page.tsx` |
| `work.php` | `app/work/page.tsx` |
| `topup.php` | `app/topup/page.tsx` |
| `admin.php` | `app/admin/page.tsx` |

### การแปลง HTML → JSX (เปลี่ยนแค่ syntax):
- `class=` → `className=`
- `onclick=` → `onClick=`
- `<?php echo $x ?>` → `{x}`
- inline `<script>` → แยกเป็น React state/hooks
- **สี, font, spacing, animation, card style, button style — เหมือนเดิมทุกอย่าง**

### fetch calls ใน PHP → Next.js API routes:
```
// PHP เดิม (เห็น e-ed URL)
fetch("https://e-ed.e-tech.ac.th/api/setLearnProgress", {...})

// Next.js ใหม่ (ซ่อน URL ใน server)
fetch("/api/progress", {...})
```

### JavaScript ใน PHP → React Hooks:
```typescript
// PHP เดิม
const token = localStorage.getItem("token");

// Next.js ใหม่ (client component)
const [token] = useState(() =>
  typeof window !== 'undefined' ? localStorage.getItem("token") : null
);
```

---

## Overview
แปลงจาก PHP frontend เป็น Next.js App Router
- Frontend: React + Tailwind CSS + IBM Plex Sans Thai
- Backend: Next.js API Routes (ซ่อน e-ed endpoints ทั้งหมด)
- DB: MySQL ผ่าน `mysql2` package
- Deploy: Vercel (frontend) + PlanetScale หรือ Railway (MySQL)
- **คนนอกไม่เห็น e-ed API endpoints เลย** เพราะทุก call ผ่าน `/api/` ของ Next.js

---

## โครงสร้างโปรเจกต์

```
supereed-next/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              → redirect to /login
│   ├── login/
│   │   └── page.tsx          → หน้า login
│   ├── courses/
│   │   └── page.tsx          → หน้า index (วิชาของฉัน)
│   ├── work/
│   │   └── page.tsx          → หน้า work (tasks + auto)
│   └── topup/
│       └── page.tsx          → หน้าเติมเงิน
├── app/api/
│   ├── auth/
│   │   └── login/route.ts    → proxy login ไป e-ed
│   ├── courses/route.ts      → proxy ดึงวิชา
│   ├── chapters/route.ts     → proxy ดึง chapters
│   ├── lessons/route.ts      → proxy ดึง lessons ของ item
│   ├── progress/route.ts     → proxy setLearnProgress
│   ├── quiz/
│   │   ├── start/route.ts    → proxy เริ่ม quiz
│   │   └── answer/route.ts   → proxy sendAnswer
│   ├── credit/route.ts       → ดึง credit balance จาก DB
│   ├── spend/route.ts        → หักเครดิต
│   ├── topup/route.ts        → upload slip + SlipOK
│   ├── mark-ran/route.ts     → mark paid_tasks ว่า ran แล้ว
│   └── admin/
│       ├── auth/route.ts
│       ├── dashboard/route.ts
│       ├── slips/route.ts
│       ├── users/route.ts
│       ├── transactions/route.ts
│       └── settings/route.ts
├── lib/
│   ├── db.ts                 → MySQL connection pool
│   ├── eed-client.ts         → helper fetch ไป e-ed API (server-side only)
│   └── slipok.ts             → SlipOK helper
├── components/
│   ├── Navbar.tsx
│   ├── CreditBadge.tsx
│   └── PayModal.tsx
└── middleware.ts             → protect routes ที่ต้อง auth
```

---

## Stack และ Dependencies

```json
{
  "dependencies": {
    "next": "14",
    "react": "^18",
    "react-dom": "^18",
    "mysql2": "^3",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

---

## Database

ใช้ schema เดิมทั้งหมด (copy จาก db.sql):
- users, transactions, paid_tasks, settings, slip_uploads

### `lib/db.ts`

```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
```

---

## Environment Variables (`.env.local`)

```env
# MySQL
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASS=your-db-password
DB_NAME=supereed

# SlipOK
SLIPOK_API_KEY=SLIPOK6YG8Z7X
SLIPOK_BRANCH_ID=66058
SLIPOK_ENDPOINT=https://api.slipok.com/api/line/apikey/

# Shop
SHOP_ACCOUNT=1448121948
ADMIN_PASSWORD=changeme123
BANK_NAME=ธนาคารกสิกรไทย
BANK_ACCOUNT_NO=144-8-12194-8
BANK_ACCOUNT_NAME=เสฏฐวุฒิ ระดาชัย

# Auth secret สำหรับ sign session
AUTH_SECRET=random-secret-string-here
```

---

## Auth Flow

ใช้ **cookie-based session** แทน localStorage:

```typescript
// app/api/auth/login/route.ts
export async function POST(req: Request) {
  const { username, password } = await req.json();

  // ยิงไป e-ed (server-side — คนนอกไม่เห็น)
  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/login?username=${username}&password=${password}&app_type=browser`,
    { method: 'POST' }
  );
  const data = await res.json();
  if (!data.success) {
    return Response.json({ error: 'invalid credentials' }, { status: 401 });
  }

  // เก็บ token ใน httpOnly cookie (client อ่านไม่ได้)
  const response = Response.json({ success: true, name: data.full_name });
  response.headers.set('Set-Cookie',
    `eed_token=${data.token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`
  );
  return response;
}
```

---

## E-ED Proxy Client

```typescript
// lib/eed-client.ts
// ไฟล์นี้รันฝั่ง server เท่านั้น — client ไม่เห็น URL e-ed เลย

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
```

---

## API Routes หลัก

### `app/api/courses/route.ts`
```typescript
import { cookies } from 'next/headers';
import { eedFetch } from '@/lib/eed-client';

export async function GET(req: Request) {
  const token = cookies().get('eed_token')?.value;
  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year    = searchParams.get('year');
  const term    = searchParams.get('term');
  const id_code = searchParams.get('id_code');

  const data = await eedFetch(
    `/courses?year=${year}&term=${term}&id_code=${id_code}`,
    token
  );
  return Response.json(data);
}
```

### `app/api/progress/route.ts`
```typescript
import { cookies } from 'next/headers';
import { eedFetch } from '@/lib/eed-client';

export async function POST(req: Request) {
  const token = cookies().get('eed_token')?.value;
  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();

  // ยิงไป e-ed (ซ่อนอยู่ใน server)
  const data = await eedFetch('/setLearnProgress', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return Response.json(data);
}
```

### `app/api/quiz/answer/route.ts`
```typescript
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const token = cookies().get('eed_token')?.value;
  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const { itemid, answers } = await req.json();

  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/quiz/v2/${itemid}/sendAnswer?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    }
  );
  return Response.json(await res.json());
}
```

---

## Frontend Pages

### `app/login/page.tsx`
- form รับ username + password
- POST `/api/auth/login`
- ถ้าสำเร็จ → redirect `/courses`
- ไม่เก็บ token ใน localStorage เลย — อยู่ใน httpOnly cookie

### `app/courses/page.tsx`
- fetch `/api/courses` (ผ่าน server)
- แสดง card วิชา
- คลิก → ไป `/work?course_id=xxx&recid=xxx`

### `app/work/page.tsx`
- fetch `/api/chapters?course_id=xxx&recid=xxx`
- แสดง chapters + items
- Item state: done / paid / unpaid (เหมือนเดิม)
- Auto button → modal ชำระเงิน → POST `/api/spend` → POST `/api/progress` (ทุก call ผ่าน Next.js)

### `app/topup/page.tsx`
- แสดงข้อมูลบัญชี
- upload slip → POST `/api/topup`
- แสดง status

---

## Middleware (ป้องกัน routes)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('eed_token');
  const { pathname } = request.nextUrl;

  // routes ที่ต้อง login
  const protected_routes = ['/courses', '/work', '/topup'];

  if (protected_routes.some(r => pathname.startsWith(r)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/courses/:path*', '/work/:path*', '/topup/:path*'],
};
```

---

## Deploy บน Vercel

### 1. สร้างโปรเจกต์
```bash
npx create-next-app@latest supereed-next --typescript --tailwind --app
cd supereed-next
npm install mysql2
```

### 2. MySQL ฟรีบน PlanetScale หรือ Railway
**PlanetScale (แนะนำ — ฟรี):**
- สมัครที่ planetscale.com
- สร้าง DB → copy connection string
- ใส่ใน `.env.local`

**Railway:**
- สมัครที่ railway.app
- New Project → MySQL → copy credentials

### 3. Deploy
```bash
# push ขึ้น GitHub ก่อน
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/username/supereed-next
git push -u origin main

# แล้วไป vercel.com → Import → เลือก repo
# ใส่ environment variables ทั้งหมด
# กด Deploy
```

### 4. Environment Variables บน Vercel
ไปที่ Project Settings → Environment Variables → ใส่ทุกตัวจาก `.env.local`

---

## ข้อดีเทียบกับ PHP version

| | PHP (เดิม) | Next.js (ใหม่) |
|--|-----------|---------------|
| เห็น e-ed endpoints | ✅ เห็นได้ | ❌ ซ่อนหมด |
| Deploy ฟรี | InfinityFree (ช้า) | Vercel (เร็ว) |
| Token storage | localStorage | httpOnly cookie |
| SSL | ไม่มี | มีอัตโนมัติ |
| Scale | จำกัด | Auto-scale |

---

## สิ่งที่ Logic เหมือนเดิมทุกอย่าง

- PDF timing: 45-90 วินาที random
- VDO timing: ใช้ duration จาก API จริง
- doAll() loop ทุก lesson
- Quiz: sendAnswer + setLearnProgress
- Credit system: ตาราง DB เหมือนกันทุกอย่าง
- SlipOK integration: base64 ไม่เก็บไฟล์
- Admin panel: 6 แท็บเหมือนเดิม