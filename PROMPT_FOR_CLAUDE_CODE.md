# Blueberry — คู่มือโค้ดสำหรับ Claude (Web)

> เอกสารนี้อธิบายโปรเจกต์ **Blueberry** ทั้งหมดตามโค้ดจริงใน repo ณ ปัจจุบัน  
> ใช้เป็น context สำหรับ Claude บนเว็บเมื่อต้องแก้ไข/พัฒนาต่อ

---

## ภาพรวม

**Blueberry** คือแพลตฟอร์ม automation สำหรับระบบ e-ed (e-ed.e-tech.ac.th)  
แปลงมาจาก PHP เดิม (`blueberry/*.php`) เป็น **Next.js 14 App Router**

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 18 + Tailwind CSS + IBM Plex Sans Thai |
| Backend | Next.js API Routes (proxy ไป e-ed ฝั่ง server) |
| Database | **PostgreSQL** ผ่าน `pg` (ไม่ใช่ MySQL) |
| Payment | SlipOK API (ตรวจสลิปอัตโนมัติ) |
| Deploy | Vercel |

### กฎสำคัญ
1. **ห้าม redesign UI** — copy HTML/Tailwind จาก PHP เดิม เปลี่ยนแค่ syntax เป็น JSX
2. ชื่อแอป: **Blueberry** (logo 🫐) — ไม่ใช่ "Super E-ED"
3. **e-ed URLs ซ่อนฝั่ง server** — client เรียกแค่ `/api/*`
4. **Token เก็บใน localStorage** (ไม่ใช่ httpOnly cookie ตามที่ doc เก่าบอก)

---

## โครงสร้างโปรเจกต์

```
blueberry/
├── app/
│   ├── layout.tsx              # Root layout, metadata, favicon 🫐
│   ├── page.tsx                # redirect → /login
│   ├── globals.css             # Tailwind + IBM Plex Sans Thai
│   ├── login/page.tsx          # หน้า login
│   ├── courses/page.tsx        # รายวิชา + Auto All Courses
│   ├── work/page.tsx           # รายละเอียดวิชา + Auto tasks
│   ├── topup/page.tsx          # เติมเครดิต (อัพโหลดสลิป)
│   ├── reseller/page.tsx       # Reseller login ในนามลูกค้า
│   ├── admin/page.tsx          # Admin panel (5 แท็บ)
│   └── api/                    # API routes (ดูรายละเอียดด้านล่าง)
├── components/
│   ├── Navbar.tsx              # (มีแต่ยังไม่ได้ใช้ในหน้าหลัก — หน้าต่างๆ มี nav ของตัวเอง)
│   ├── CreditBadge.tsx
│   └── PayModal.tsx
├── lib/
│   ├── db.ts                   # PostgreSQL pool
│   ├── eed-client.ts           # helper fetch ไป e-ed (server-only)
│   ├── slipok.ts               # SlipOK verification
│   └── admin-auth.ts           # admin token (SHA256 daily)
├── blueberry/                  # PHP เดิม (reference)
│   ├── login.php, index.php, work.php, topup.php, admin.php
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## Dependencies (`package.json`)

```json
{
  "dependencies": {
    "@types/pg": "^8.20.0",
    "lucide-react": "^1.17.0",
    "next": "14",
    "pg": "^8.21.0",
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^3.8.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

---

## Environment Variables (`.env.local`)

```env
# PostgreSQL (Supabase / Neon / Railway)
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
DB_PORT=6543          # default ใน lib/db.ts

# SlipOK
SLIPOK_API_KEY=
SLIPOK_BRANCH_ID=
SLIPOK_ENDPOINT=https://api.slipok.com/api/line/apikey/

# บัญชีรับเงิน
BANK_NAME=
BANK_ACCOUNT_NO=
BANK_ACCOUNT_NAME=
QR_CODE_IMAGE=qrcode.jpg   # ไฟล์ใน public/

# Admin
ADMIN_PASSWORD=
```

---

## Database Schema (PostgreSQL)

อนุมานจาก SQL queries ในโค้ด:

```sql
-- users
CREATE TABLE users (
  student_id     TEXT PRIMARY KEY,
  credit_balance NUMERIC DEFAULT 0,
  role           TEXT DEFAULT 'user',  -- 'user' | 'admin' | 'reseller'
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- transactions
CREATE TABLE transactions (
  id          SERIAL PRIMARY KEY,
  student_id  TEXT NOT NULL,
  type        TEXT NOT NULL,   -- 'topup' | 'spend' | 'refund'
  amount      NUMERIC NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'completed',  -- 'completed' | 'pending' | 'rejected'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- paid_tasks (ติดตาม task ที่จ่ายแล้วแต่ยังไม่รัน)
CREATE TABLE paid_tasks (
  student_id TEXT NOT NULL,
  course_id  INTEGER NOT NULL,
  itemid     INTEGER NOT NULL,
  paid_at    TIMESTAMPTZ DEFAULT NOW(),
  ran_at     TIMESTAMPTZ,          -- NULL = ยังไม่รัน
  UNIQUE (student_id, course_id, itemid)
);

-- settings
CREATE TABLE settings (
  key_name TEXT PRIMARY KEY,
  value    TEXT NOT NULL
);
-- keys ที่ใช้: price_per_task, price_per_task_reseller, maintenance_mode,
--              BANK_NAME, BANK_ACCOUNT_NO, BANK_ACCOUNT_NAME, PRICE_PER_ITEM

-- slip_uploads
CREATE TABLE slip_uploads (
  id          SERIAL PRIMARY KEY,
  student_id  TEXT NOT NULL,
  amount      NUMERIC,
  status      TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## localStorage Keys

| Key | ใช้เมื่อ | ค่า |
|-----|---------|-----|
| `token` | ทุกหน้า | e-ed JWT token |
| `year` | courses/work | ปีการศึกษา (พ.ศ.) |
| `term` | courses/work | เทอม |
| `id_code` | ทุกหน้า | รหัสนักศึกษา |
| `student_id` | credit/spend | เหมือน id_code |
| `full_name` | courses | ชื่อ-นามสกุล |
| `id_class` | courses | ชั้นเรียน |
| `subjects` | courses/work | JSON array รายวิชา |
| `user_role` | courses | `user` / `admin` / `reseller` |
| `reseller_token` | reseller mode | backup token ของ reseller |
| `reseller_id` | reseller mode | รหัส reseller (เรียกเก็บเงิน) |
| `reseller_openid` | reseller mode | backup |
| `reseller_recid` | reseller mode | backup |
| `reseller_name` | reseller mode | backup ชื่อ |
| `admin_token` | admin | SHA256 daily token |

---

## แผนที่ API Routes

### e-ed Proxy (ซ่อน URL จริง)

| Client เรียก | Method | e-ed endpoint จริง |
|-------------|--------|-------------------|
| `/api/auth/login` | POST | `POST /api/login?username=&password=&app_type=browser` |
| `/api/courses` | GET | `GET /api/courses?year=&term=&id_code=` |
| `/api/courses/register` | POST | `POST /api/course/{id}/register` |
| `/api/chapters` | GET | `GET /api/course/{id}/v2Items?recid=` |
| `/api/lessons` | GET | `GET /api/item/{itemid}/lessons?recid=` |
| `/api/progress` | POST | `POST /api/setLearnProgress` |
| `/api/quiz/answer` | POST | fetch questions + `POST /api/quiz/v2/{id}/sendAnswer` |
| `/api/quiz/start` | GET | `GET /api/quiz/v2/{itemId}/start` |
| `/api/reseller/login` | POST | login e-ed ด้วย credentials ลูกค้า |

### Database / Business Logic

| Route | Method | หน้าที่ |
|-------|--------|--------|
| `/api/credit` | POST | ดึง balance, price, paid_items, history |
| `/api/spend` | POST | หักเครดิต atomic + บันทึก paid_tasks |
| `/api/refund` | POST | คืนเงิน task ที่จ่ายแล้วแต่ไม่มีอะไรให้ทำ |
| `/api/topup` | POST | อัพโหลดสลิป → SlipOK → เติมเครดิต |
| `/api/mark-ran` | POST | อัพเดต ran_at ใน paid_tasks |
| `/api/payment-info` | POST | ข้อมูลบัญชีจาก env |
| `/api/auth/logout` | POST | ลบ cookies (legacy) |

### Admin (ต้อง Bearer token จาก `todayAdminToken()`)

| Route | Method | หน้าที่ |
|-------|--------|--------|
| `/api/admin/auth` | POST/GET | login + verify token |
| `/api/admin/dashboard` | GET | stats + revenue chart 7 วัน |
| `/api/admin/slips` | GET/PATCH | ดู/อนุมัติสลิป |
| `/api/admin/users` | GET/PATCH | จัดการ user, credit, role |
| `/api/admin/transactions` | GET | ประวัติธุรกรรม |
| `/api/admin/settings` | GET/POST | ตั้งค่าระบบ |

---

## lib/ — โค้ดเต็ม

### `lib/db.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port:     parseInt(process.env.DB_PORT ?? '6543'),
  ssl:      { rejectUnauthorized: false },
});

export default pool;
```

### `lib/eed-client.ts`

```typescript
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

### `lib/slipok.ts`

```typescript
export async function verifySlip(
  base64Image: string
): Promise<{ valid: boolean; amount: number; ref?: string }> {
  const apiKey   = process.env.SLIPOK_API_KEY;
  const branchId = process.env.SLIPOK_BRANCH_ID;
  const endpoint = process.env.SLIPOK_ENDPOINT;

  if (!apiKey || !branchId || !endpoint) {
    return { valid: false, amount: 0 };
  }

  const url    = `${endpoint}${branchId}`;
  const buffer = Buffer.from(base64Image, 'base64');
  const blob   = new Blob([buffer], { type: 'image/jpeg' });
  const form   = new FormData();
  form.append('files', blob, 'slip.jpg');
  form.append('log', 'true');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-authorization': apiKey },
    body: form,
  });

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return { valid: false, amount: 0 };
  }

  const data = await res.json();
  if (!data.success) return { valid: false, amount: 0 };

  return {
    valid:  true,
    amount: Number(data.data?.amount ?? 0),
    ref:    data.data?.transRef,
  };
}
```

### `lib/admin-auth.ts`

```typescript
import { createHash } from 'crypto';

export function todayAdminToken(): string {
  const today = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update((process.env.ADMIN_PASSWORD ?? '') + today).digest('hex');
}

export function requireAdmin(req: Request): boolean {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token.length > 0 && token === todayAdminToken();
}
```

---

## API Routes — โค้ดเต็ม

### `app/api/auth/login/route.ts`

- POST `{ username, password }` → login e-ed
- Upsert user ใน DB (`ON CONFLICT DO NOTHING`)
- ดึง `role` จาก DB
- Return `{ ...eedData, role }` — **ไม่ set cookie**, client เก็บ token ใน localStorage เอง
- ถ้า login fail → delay 1.5s แล้ว return 401

### `app/api/auth/logout/route.ts`

- POST → ลบ cookies: `eed_token`, `eed_username`, `eed_id_code`, `admin_token`

### `app/api/courses/route.ts`

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token   = searchParams.get('token')   ?? '';
  const year    = searchParams.get('year')    ?? '';
  const term    = searchParams.get('term')    ?? '';
  const id_code = searchParams.get('id_code') ?? '';
  if (!token) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/courses?year=${encodeURIComponent(year)}&term=${encodeURIComponent(term)}&id_code=${encodeURIComponent(id_code)}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return Response.json(await res.json());
}
```

### `app/api/courses/register/route.ts`

- POST `{ token, host_id=1, open_id, courseid/course_id }`
- → `POST /api/course/{courseId}/register` body: `{ host_id, open_id, courseid }`

### `app/api/chapters/route.ts`

- GET `?token=&course_id=&recid=`
- ใช้ `eedFetch('/course/{course_id}/v2Items?recid={recid}', token)`
- **หมายเหตุ:** ไม่ใช่ `/item/{id}/chapters` แบบ PHP เดิม

### `app/api/lessons/route.ts`

- GET `?itemid=&recid=&token=` (token จาก query หรือ cookie)
- → `eedFetch('/item/{itemid}/lessons?recid={recid}', token)`

### `app/api/progress/route.ts`

- POST body: `{ token, recid, openid, student_id, itemid, lessonid, lesson_type, item_type, courseid, full_time, view_time, percent }`
- → `eedFetch('/setLearnProgress', token, { method: 'POST', body })`

### `app/api/quiz/answer/route.ts`

**POST — Auto quiz แบบครบวงจร:**
1. Fetch `GET /api/quiz/{itemid}/answer?token=` → ได้ array คำถาม
2. หา correct answer จาก `choices_show_answer` ที่ `answer === 'Y'`
3. Submit `POST /api/quiz/v2/{itemid}/sendAnswer?token=` body: `{ recid, itemid, openid, courseid, ans }`
4. Return `{ skipped: true }` ถ้าไม่มีคำถาม/คำตอบ

**GET — backward compat:** `GET /api/quiz/{itemid}/answer?token=`

### `app/api/quiz/start/route.ts`

- GET `?itemId=` — ใช้ cookie `eed_token`
- → `GET /api/quiz/v2/{itemId}/start?token=`

### `app/api/credit/route.ts`

- POST `{ student_id, course_id? }`
- Return: `{ balance, price_per_task, price_per_task_reseller, paid_items, maintenance, history }`
- `paid_items` = itemid ที่จ่ายแล้วแต่ `ran_at IS NULL`
- `history` = 20 transactions ล่าสุด

### `app/api/spend/route.ts`

- POST `{ student_id, course_id, item_ids[], reseller_student_id? }`
- Atomic transaction:
  - ถ้ามี `reseller_student_id` → หักจาก reseller ที่ราคา `price_per_task_reseller`
  - กรอง item ที่จ่ายแล้ว (ran_at IS NULL) ออก → ไม่หักซ้ำ
  - `UPDATE users SET credit_balance = credit_balance - cost`
  - `INSERT INTO paid_tasks ... ON CONFLICT DO NOTHING`
  - `INSERT INTO transactions (type='spend')`
- Return: `{ success, new_balance, charged, paid_items }`

### `app/api/refund/route.ts`

- POST `{ student_id, course_id, item_ids[] }`
- ลบ paid_tasks ที่ `ran_at IS NULL` → คืนเครดิตตาม `price_per_task`
- ใช้เมื่อจ่ายแล้วแต่ task เสร็จหมดแล้ว (ไม่มีอะไรให้ทำ)

### `app/api/topup/route.ts`

- POST FormData: `student_id`, `slip` (File)
- → base64 → `verifySlip()` → เติมเครดิต + บันทึก transaction + slip_uploads
- Return: `{ status: 'approved'|'rejected'|'error', message, new_balance }`

### `app/api/mark-ran/route.ts`

- POST `{ student_id, course_id, item_ids[] }`
- `UPDATE paid_tasks SET ran_at = NOW() WHERE ... AND ran_at IS NULL`

### `app/api/payment-info/route.ts`

- POST (no body) → `{ bank_name, account_no, account_name, qr_image }` จาก env

### `app/api/reseller/login/route.ts`

- POST `{ customer_student_id, customer_password, reseller_student_id }`
- ตรวจ role reseller ใน DB
- Login e-ed ด้วย credentials ลูกค้า
- Return `{ success, token, student_id, year, term }`

### Admin Routes

**`app/api/admin/auth/route.ts`**
- POST `{ password, student_id }` → ตรวจ ADMIN_PASSWORD + role=admin ใน DB → return `{ token: todayAdminToken() }`
- GET + Bearer → `{ authenticated: boolean }`

**`app/api/admin/dashboard/route.ts`**
- Stats: total_revenue, pending_slips, total_users, tasks_today, stuck_tasks
- revenue_chart: 7 วันล่าสุด (timezone Asia/Bangkok)
- recent_transactions: 10 รายการล่าสุด

**`app/api/admin/slips/route.ts`**
- GET: รายการ slip 100 รายการล่าสุด
- PATCH `?id=` + `{ status: 'approved'|'rejected' }` → อนุมัติแล้วเติมเครดิต

**`app/api/admin/users/route.ts`**
- GET: รายชื่อ users ทั้งหมด
- PATCH actions: `add_credit`, `remove_credit`, `set_role` (user/admin/reseller)

**`app/api/admin/transactions/route.ts`**
- GET: 200 transactions ล่าสุด

**`app/api/admin/settings/route.ts`**
- GET: settings ทั้งหมด (fallback DEFAULT_SETTINGS จาก env)
- POST `{ key_name, value }` → upsert settings

---

## Frontend Pages — Logic สำคัญ

### `app/login/page.tsx`

**Flow:**
1. POST `/api/auth/login` → ได้ token, role, default_year_term
2. เก็บ localStorage: `year`, `term`, `id_code`, `student_id`, `token`, `user_role`
3. GET `/api/courses?...` → เก็บ `subjects`, `full_name`, `id_class`
4. `router.push('/courses')`

**UI:** indigo theme, fade-in animation, IBM Plex Sans Thai

### `app/courses/page.tsx`

**Features:**
- แสดง grid รายวิชาจาก localStorage `subjects`
- คลิกวิชา → register (ถ้าไม่มี recid) → `/work?course_id=&recid=&name=`
- **Select Mode:** เลือกหลายวิชา → Auto All Courses
- **Reseller mode:** banner สี amber, หักเครดิตจาก `reseller_id`
- `loadNavCredit()` → POST `/api/credit`

**Auto All logic (`runAutoAll`):**
1. สำหรับแต่ละวิชาที่เลือก: fetch chapters + credit
2. กรอง items ที่ยังไม่เสร็จ (`!isItemDone`)
3. หักเครดิต items ใหม่ → POST `/api/spend`
4. Loop media items: fetch lessons → POST `/api/progress` (PDF: random 45-90s, VDO: duration จริง)
5. Loop quiz items: POST `/api/quiz/answer` → POST `/api/progress`
6. POST `/api/mark-ran` เมื่อเสร็จแต่ละวิชา

**`isItemDone(item)`:**
```typescript
item.view_success === 'Y' ||
(item.item_type === 'Q' && item.stu_score >= item.item_score && item.item_score > 0)
```

### `app/work/page.tsx` (~911 บรรทัด)

**URL params:** `course_id`, `recid`, `name`

**Features:**
- แสดง chapters/items พร้อม progress bar
- เลือก tasks (checkbox) → ชำระเงิน → Auto
- **Resubmit Quiz mode:** ส่ง quiz ซ้ำถ้าคะแนนไม่เต็ม
- **Resume:** ถ้ามี paid_items ค้าง → auto resume หลังโหลด
- **Cleanup:** mark-ran สำหรับ items ที่เสร็จแล้วใน e-ed แต่ยังค้างใน paid_tasks
- **Refund:** ถ้าจ่ายแล้วแต่ไม่มี task ให้ทำ → POST `/api/refund`

**Key functions:**
| Function | หน้าที่ |
|----------|--------|
| `fetchChapters()` | GET `/api/chapters` |
| `loadCredit()` | POST `/api/credit` — ถ้า maintenance → แสดงหน้าปิดปรับปรุง |
| `markMedia(item)` | fetch lessons → loop POST progress พร้อม countdown |
| `doQuiz(item)` | POST `/api/quiz/answer` → POST `/api/progress` |
| `doAll(selectedIds)` | Auto loop media + quiz |
| `confirmPay()` | POST `/api/spend` → `doAll()` → `/api/mark-ran` หรือ `/api/refund` |
| `runSingleItem(item)` | รัน task เดียวที่จ่ายแล้ว |

**Timing rules:**
- PDF (`lesson_type === 'F'`): `full_time` = random 45-90 วินาที, wait 5-10s UI
- VDO (`lesson_type === 'Y'`): ใช้ `lenght_vdo` หรือ `duration` จาก API
- Quiz progress: `view_time: 19, percent: 100`

### `app/topup/page.tsx`

- แสดง balance card, ข้อมูลบัญชี, QR code (`/qrcode.jpg`)
- อัพโหลดสลิป → POST `/api/topup` (FormData)
- แสดงประวัติ 20 รายการล่าสุด

### `app/reseller/page.tsx`

- เฉพาะ `user_role === 'reseller'`
- Login ลูกค้า → POST `/api/reseller/login`
- Backup reseller keys → overwrite session ด้วยข้อมูลลูกค้า
- Redirect `/courses` ในโหมดตัวแทน

### `app/admin/page.tsx` (~825 บรรทัด)

**5 แท็บ:**
1. **Dashboard** — stats cards + recharts AreaChart (revenue 7 วัน) + recent transactions (auto-refresh 30s)
2. **Slips** — ตาราง slip_uploads
3. **Users** — จัดการ credit, role (user/admin/reseller)
4. **Transactions** — ประวัติ 200 รายการ
5. **Settings** — maintenance toggle, price_per_task, bank info

**Auth:** localStorage `admin_token` = SHA256(ADMIN_PASSWORD + today)

---

## Business Logic สรุป

### Credit Flow
```
เติมเงิน: อัพโหลดสลิป → SlipOK verify → +credit → transactions(topup)
ใช้งาน:   เลือก tasks → spend → paid_tasks → auto run → mark-ran
คืนเงิน:  จ่ายแล้วแต่ไม่มี task → refund → ลบ paid_tasks + +credit
Reseller:  หักจาก reseller_id ที่ราคา price_per_task_reseller
```

### Item States (ใน work page)
| State | แสดง |
|-------|------|
| เสร็จแล้ว (`view_success === 'Y'`) | ✅ เสร็จแล้ว |
| จ่ายแล้วรอรัน (`paidItems.has(itemid)`) | ปุ่ม "ส่งงาน" |
| ยังไม่จ่าย | checkbox เลือก |

### Maintenance Mode
- `settings.maintenance_mode === '1'`
- work page: แสดงหน้าปิดปรับปรุงแทน content

---

## Tailwind / Styling

### `tailwind.config.ts`
- Font: `IBM Plex Sans Thai`, `IBM Plex Sans`
- Brand colors: indigo scale (`brand-50` ถึง `brand-900`)

### `app/globals.css`
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Common CSS (ใน `<style jsx>` ของแต่ละหน้า)
```css
.fade-in { animation: fadeIn 0.4s ease forwards; }
@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
.card-hover { transition: all 0.2s ease; }
.card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
```

### Design System
- Background: `bg-slate-50`
- Cards: `bg-white rounded-2xl border border-slate-100`
- Primary button: `bg-indigo-600 hover:bg-indigo-700`
- Credit badge: `bg-emerald-50 text-emerald-700`
- Reseller: `bg-amber-500`

---

## Components

### `components/Navbar.tsx`
- Links: วิชาของฉัน, เติมเงิน
- CreditBadge + logout → POST `/api/auth/logout`
- **หมายเหตุ:** หน้าหลัก (courses/work/topup) มี inline nav ของตัวเอง ไม่ได้ import Navbar

### `components/CreditBadge.tsx`
- fetch `/api/credit` (GET — **อาจต้องแก้เป็น POST** เพราะ route รองรับแค่ POST)
- แสดง 💎 + balance

### `components/PayModal.tsx`
- Modal "เครดิตไม่พอ" → link ไป `/topup`

---

## การแปลง PHP → JSX (reference)

```
class=          →  className=
onclick=        →  onClick=
for=            →  htmlFor=
<img>           →  <img />
style="a:b"     →  style={{ a: 'b' }}
inline <script> →  React useState/useEffect
```

### แผนที่ไฟล์ PHP → Next.js

| PHP เดิม | Next.js |
|----------|---------|
| `login.php` | `app/login/page.tsx` |
| `index.php` | `app/courses/page.tsx` |
| `work.php` | `app/work/page.tsx` |
| `topup.php` | `app/topup/page.tsx` |
| `admin.php` | `app/admin/page.tsx` |

---

## Known Issues / ข้อควรระวัง

1. **CreditBadge** เรียก GET `/api/credit` แต่ route รองรับแค่ POST
2. **ไม่มี middleware.ts** — auth ตรวจฝั่ง client ด้วย localStorage
3. **Token ใน localStorage** — ไม่ secure เท่า httpOnly cookie
4. **chapters endpoint** ใช้ `v2Items` ไม่ใช่ `chapters` แบบ PHP เดิม
5. **Navbar component** สร้างแล้วแต่หน้าหลักยังไม่ได้ใช้

---

## คำสั่งพัฒนา

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

---

## สิ่งที่ต้องรักษาเมื่อแก้ไข

- UI ต้องเหมือน PHP เดิม (สี, spacing, animation)
- ชื่อแอป: **Blueberry** + 🫐
- e-ed URLs ต้องอยู่ฝั่ง server เท่านั้น
- Credit system: atomic transactions, ไม่หักซ้ำ
- PDF timing: 45-90 วินาที random
- VDO timing: duration จาก API
- Quiz: auto-answer จาก `choices_show_answer`
- Reseller: หักจาก reseller ไม่ใช่ลูกค้า
- Admin token: เปลี่ยนทุกวัน (SHA256 + date)
