# คำสั่งสำหรับ Claude Code

## งาน
แปลงไฟล์ PHP เป็น Next.js **โดย copy HTML/CSS/JS เดิมมาใช้ทั้งหมด** ห้าม redesign UI เด็ดขาด

---

## กฎเหล็ก
1. **Copy HTML structure เดิม 100%** — เปลี่ยนแค่ syntax เป็น JSX
2. **Copy Tailwind classes เดิมทุกตัว** — ห้ามเปลี่ยนสี spacing หรือ layout
3. **Copy animation และ style เดิม** — fade-in, card-hover ฯลฯ
4. ชื่อแอปเปลี่ยนจาก "Super E-ED" → **"Blueberry"** และ logo เปลี่ยนเป็น 🫐
5. **fetch ทุก call ไป e-ed** → เปลี่ยนเป็น Next.js API route แทน

---

## การเปลี่ยน fetch URLs

| เดิม (PHP — เห็นได้) | ใหม่ (Next.js — ซ่อน) |
|---------------------|----------------------|
| `fetch("https://e-ed.e-tech.ac.th/api/login?...")` | `fetch("/api/auth/login", {method:"POST", body:...})` |
| `fetch("https://e-ed.e-tech.ac.th/api/courses?...")` | `fetch("/api/courses?...")` |
| `fetch("https://e-ed.e-tech.ac.th/api/course/${id}/register", ...)` | `fetch("/api/courses/register", {method:"POST", body:...})` |
| `fetch("https://e-ed.e-tech.ac.th/api/item/${id}/chapters?...")` | `fetch("/api/chapters?...")` |
| `fetch("https://e-ed.e-tech.ac.th/api/item/${id}/lessons?...")` | `fetch("/api/lessons?...")` |
| `fetch("https://e-ed.e-tech.ac.th/api/setLearnProgress", ...)` | `fetch("/api/progress", {method:"POST", body:...})` |
| `fetch("https://e-ed.e-tech.ac.th/api/quiz/v2/${id}/sendAnswer?token=...", ...)` | `fetch("/api/quiz/answer", {method:"POST", body:...})` |
| `fetch("api/credit.php", ...)` | `fetch("/api/credit", ...)` |
| `fetch("api/spend.php", ...)` | `fetch("/api/spend", ...)` |
| `fetch("api/topup_slip.php", ...)` | `fetch("/api/topup", ...)` |
| `fetch("api/mark_ran.php", ...)` | `fetch("/api/mark-ran", ...)` |
| `fetch("api/payment_info.php", ...)` | `fetch("/api/payment-info", ...)` |
| `fetch("api/admin_action.php", ...)` | `fetch("/api/admin/action", ...)` |
| `fetch("api/admin_auth.php", ...)` | `fetch("/api/admin/auth", ...)` |

---

## การแปลง syntax PHP → JSX

```
class=          →  className=
onclick=        →  onClick=
for=            →  htmlFor=
<img>           →  <img />  (self-closing)
style="a:b"     →  style={{ a: 'b' }}
```

---

## Pages ที่ต้องสร้าง

### `app/login/page.tsx`
Copy จาก `login.php` ทั้งหมด แปลงเป็น React component
- `doLogin()` → เปลี่ยน fetch ไป `/api/auth/login`
- ถ้าสำเร็จ → `router.push('/courses')`
- เก็บ token, year, term, id_code ไว้ใน localStorage เหมือนเดิม

### `app/courses/page.tsx`
Copy จาก `index.php` ทั้งหมด
- `openCourse()` → fetch register ไป `/api/courses/register`
- แล้ว `router.push('/work?...')`
- `loadNavCredit()` → fetch `/api/credit`

### `app/work/page.tsx`
Copy จาก `work.php` ทั้งหมด (ไฟล์ใหญ่มาก)
- fetch chapters → `/api/chapters`
- fetch lessons → `/api/lessons`
- setLearnProgress → `/api/progress`
- sendAnswer → `/api/quiz/answer`
- credit/spend → `/api/credit`, `/api/spend`, `/api/mark-ran`

### `app/topup/page.tsx`
Copy จาก `topup.php` ทั้งหมด
- upload slip → `/api/topup`
- payment info → `/api/payment-info`
- credit → `/api/credit`

### `app/admin/page.tsx`
Copy จาก `admin.php` ทั้งหมด
- admin auth → `/api/admin/auth`
- admin actions → `/api/admin/action`

---

## API Routes ที่ต้องสร้าง (server-side — ซ่อน e-ed URLs)

### `app/api/auth/login/route.ts`
```typescript
export async function POST(req: Request) {
  const { username, password } = await req.json()
  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/login?username=${username}&password=${password}&app_type=browser`,
    { method: 'POST' }
  )
  return Response.json(await res.json())
}
```

### `app/api/courses/route.ts`
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const year = searchParams.get('year')
  const term = searchParams.get('term')
  const id_code = searchParams.get('id_code')
  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/courses?year=${year}&term=${term}&id_code=${id_code}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return Response.json(await res.json())
}
```

### `app/api/courses/register/route.ts`
```typescript
export async function POST(req: Request) {
  const { token, course_id, open_id } = await req.json()
  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/course/${course_id}/register`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_id: 1, open_id, courseid: course_id })
    }
  )
  return Response.json(await res.json())
}
```

### `app/api/chapters/route.ts`
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const course_id = searchParams.get('course_id')
  const recid = searchParams.get('recid')
  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/item/${course_id}/chapters?recid=${recid}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return Response.json(await res.json())
}
```

### `app/api/lessons/route.ts`
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const itemid = searchParams.get('itemid')
  const recid = searchParams.get('recid')
  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/item/${itemid}/lessons?recid=${recid}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return Response.json(await res.json())
}
```

### `app/api/progress/route.ts`
```typescript
export async function POST(req: Request) {
  const body = await req.json()
  const { token, ...progressData } = body
  const res = await fetch('https://e-ed.e-tech.ac.th/api/setLearnProgress', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(progressData)
  })
  return Response.json(await res.json())
}
```

### `app/api/quiz/answer/route.ts`
```typescript
export async function POST(req: Request) {
  const { token, itemid, ...answerData } = await req.json()
  const res = await fetch(
    `https://e-ed.e-tech.ac.th/api/quiz/v2/${itemid}/sendAnswer?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answerData)
    }
  )
  return Response.json(await res.json())
}
```

### `app/api/credit/route.ts`
Copy logic จาก PHP `api/credit.php` — ต่อ MySQL แล้ว return balance, price_per_task, paid_items, history, maintenance

### `app/api/spend/route.ts`
Copy logic จาก PHP `api/spend.php` — หักเครดิต atomic transaction

### `app/api/topup/route.ts`
Copy logic จาก PHP `api/topup_slip.php` — base64 → SlipOK → DB

### `app/api/mark-ran/route.ts`
Copy logic จาก PHP `api/mark_ran.php`

### `app/api/payment-info/route.ts`
Return ข้อมูลบัญชีจาก environment variables

### `app/api/admin/auth/route.ts`
Copy logic จาก PHP `api/admin_auth.php`

### `app/api/admin/action/route.ts`
Copy logic จาก PHP `api/admin_action.php` — รองรับทุก action เดิม

---

## lib/db.ts
```typescript
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host:     process.env.DB_HOST!,
  user:     process.env.DB_USER!,
  password: process.env.DB_PASS!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
})

export default pool
```

---

## .env.local
```
DB_HOST=
DB_USER=
DB_NAME=
DB_PASS=
SLIPOK_API_KEY=
SLIPOK_BRANCH_ID=
SLIPOK_ENDPOINT=https://api.slipok.com/api/line/apikey/
SHOP_ACCOUNT=
ADMIN_PASSWORD=
BANK_NAME=
BANK_ACCOUNT_NO=
BANK_ACCOUNT_NAME=
PROMPTPAY_NO=
QR_CODE_IMAGE=qrcode.jpg
```

---

## package.json dependencies
```json
{
  "dependencies": {
    "next": "14",
    "react": "^18",
    "react-dom": "^18",
    "mysql2": "^3",
    "typescript": "^5"
  }
}
```

## tailwind.config ต้องมี IBM Plex Sans Thai
```javascript
// globals.css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
* { font-family: 'IBM Plex Sans Thai', sans-serif; }
.fade-in { animation: fadeIn 0.4s ease forwards; }
@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
.card-hover { transition: all 0.2s ease; }
.card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
```
