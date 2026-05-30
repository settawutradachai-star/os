'use client';

import { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  ArrowRightLeft,
  Settings,
  LogOut,
  Wallet,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Menu,
  X,
  CreditCard
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Tab = 'dashboard' | 'slips' | 'users' | 'transactions' | 'settings';

interface Stats {
  total_revenue: number;
  pending_slips: number;
  total_users: number;
  tasks_today: number;
  stuck_tasks: number;
}

interface DashboardData {
  stats: Stats;
  revenue_chart: { date: string; total: number }[];
  recent_transactions: RecentTx[];
}

interface RecentTx {
  id: number;
  student_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

interface Slip {
  id: number;
  student_id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface User {
  student_id: string;
  credit_balance: number;
  role: string;
  created_at: string;
}

interface Tx {
  id: number;
  student_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

interface Setting {
  key_name: string;
  value: string;
}

const TZ = 'Asia/Bangkok';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState('');
  const [stdId, setStdId] = useState('');
  const [pw, setPw] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [creditInputs, setCreditInputs] = useState<Record<string, string>>({});

  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hdr = (tok: string) => ({
    Authorization: `Bearer ${tok}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    if (!stored) return;
    fetch('/api/admin/auth', { headers: { Authorization: `Bearer ${stored}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setToken(stored);
          setAuthed(true);
          doLoad('dashboard', stored);
        } else {
          localStorage.removeItem('admin_token');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (!authed || tab !== 'dashboard' || !token) return;
    refreshRef.current = setInterval(() => {
      fetch('/api/admin/dashboard', { headers: hdr(token) })
        .then((r) => r.json())
        .then((d) => setDashboard(d))
        .catch(() => {});
    }, 30_000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [authed, tab, token]);

  async function doLoad(t: Tab, tok: string) {
    setLoading(true);
    try {
      if (t === 'dashboard') {
        const d = await fetch('/api/admin/dashboard', { headers: hdr(tok) }).then((r) => r.json());
        setDashboard(d);
      } else if (t === 'slips') {
        const d = await fetch('/api/admin/slips', { headers: hdr(tok) }).then((r) => r.json());
        setSlips(d.slips ?? []);
      } else if (t === 'users') {
        const d = await fetch('/api/admin/users', { headers: hdr(tok) }).then((r) => r.json());
        setUsers(d.users ?? []);
      } else if (t === 'transactions') {
        const d = await fetch('/api/admin/transactions', { headers: hdr(tok) }).then((r) => r.json());
        setTxs(d.transactions ?? []);
      } else if (t === 'settings') {
        const d = await fetch('/api/admin/settings', { headers: hdr(tok) }).then((r) => r.json());
        setSettings(d.settings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setAuthErr('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw, student_id: stdId.trim() }),
      });
      const data = await res.json();
      if (res.status === 401) { setAuthErr('รหัสผ่านไม่ถูกต้อง'); return; }
      if (res.status === 403) { setAuthErr('บัญชีนี้ไม่มีสิทธิ์ admin'); return; }
      if (!res.ok || !data.token) { setAuthErr('เกิดข้อผิดพลาด กรุณาลองใหม่'); return; }
      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setAuthed(true);
      doLoad('dashboard', data.token);
    } catch {
      setAuthErr('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  }

  function logout() {
    localStorage.removeItem('admin_token');
    setAuthed(false);
    setToken('');
    setDashboard(null);
  }

  function switchTab(t: Tab) {
    setTab(t);
    doLoad(t, token);
    setIsSidebarOpen(false);
  }

  async function addCredit(student_id: string) {
    const amount = Number(creditInputs[student_id]);
    if (!amount || amount <= 0) return;
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: hdr(token),
      body: JSON.stringify({ action: 'add_credit', student_id, amount }),
    });
    setCreditInputs(prev => ({ ...prev, [student_id]: '' }));
    doLoad('users', token);
  }

  async function saveSetting(key: string, value: string) {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: hdr(token),
      body: JSON.stringify({ key_name: key, value }),
    });
    doLoad('settings', token);
  }

  async function toggleRole(student_id: string, currentRole: string) {
    const role = currentRole === 'admin' ? 'user' : 'admin';
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: hdr(token),
      body: JSON.stringify({ action: 'set_role', student_id, role }),
    });
    doLoad('users', token);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Portal</h1>
            <p className="text-slate-500 text-sm mt-1">เข้าสู่ระบบเพื่อจัดการระบบ</p>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block ml-1">รหัสนักศึกษา</label>
              <input
                type="text"
                value={stdId}
                onChange={(e) => setStdId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                placeholder="Ex. 65000000"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block ml-1">รหัสผ่าน</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            {authErr && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {authErr}
              </div>
            )}
            <button
              onClick={login}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard },
    { id: 'slips',        label: 'จัดการสลิป',         icon: Receipt },
    { id: 'users',        label: 'ผู้ใช้งาน',          icon: Users },
    { id: 'transactions', label: 'ประวัติธุรกรรม',     icon: ArrowRightLeft },
    { id: 'settings',     label: 'ตั้งค่าระบบ',        icon: Settings },
  ] as const;

  const stats = dashboard?.stats;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldIcon className="w-4 h-4 text-white" />
            </div>
            AdminPanel
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <t.icon className={`w-5 h-5 ${tab === t.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              {t.label}
              {t.id === 'slips' && (stats?.pending_slips ?? 0) > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stats?.pending_slips} ใหม่
                </span>
              )}
              {t.id === 'dashboard' && (stats?.stuck_tasks ?? 0) > 0 && (
                <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stats?.stuck_tasks} ค้าง
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-500 hover:text-slate-700" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">
              {tabs.find((t) => t.id === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {loading && (
              <span className="text-sm flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                กำลังโหลด...
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">

          {/* ── Dashboard ── */}
          {tab === 'dashboard' && !dashboard && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
              <p>ไม่สามารถโหลดข้อมูลได้</p>
            </div>
          )}

          {tab === 'dashboard' && dashboard && stats && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="รายได้รวมทั้งหมด" value={`฿${(stats.total_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={Wallet} color="indigo" />
                <StatCard title="สลิปรอตรวจสอบ"   value={stats.pending_slips ?? 0} icon={Receipt}      color={(stats.pending_slips ?? 0) > 0 ? 'amber' : 'slate'} />
                <StatCard title="จำนวนผู้ใช้งาน"   value={(stats.total_users ?? 0).toLocaleString()} icon={Users} color="emerald" />
                <StatCard title="งานค้างระบบ"       value={stats.stuck_tasks ?? 0} icon={AlertCircle}  color={(stats.stuck_tasks ?? 0) > 0 ? 'red' : 'slate'} trend={(stats.stuck_tasks ?? 0) > 0 ? 'ต้องการการแก้ไข' : 'ปกติ'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">ยอดเติมเงิน 7 วันที่ผ่านมา</h2>
                      <p className="text-sm text-slate-500 mt-1">ภาพรวมรายได้แสดงผลเป็นรายวัน</p>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboard.revenue_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v: number) => `฿${v}`} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`฿${Number(value).toFixed(2)}`, 'รายได้']}
                          labelFormatter={(label: string) => `วันที่ ${label}`}
                        />
                        <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="p-6 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-800">ธุรกรรมล่าสุด</h2>
                    <p className="text-xs text-slate-500 mt-1">อัปเดตอัตโนมัติทุก 30 วิ</p>
                  </div>
                  <div className="flex-1 overflow-auto p-2">
                    <ul className="divide-y divide-slate-100">
                      {dashboard.recent_transactions.slice(0, 7).map((t) => (
                        <li key={t.id} className="p-4 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'topup' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {t.type === 'topup' ? <ArrowRightLeft className="w-5 h-5 rotate-90" /> : <CreditCard className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">ID: {t.student_id}</p>
                            <p className="text-xs text-slate-500 truncate">{t.description}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${t.type === 'topup' ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {t.type === 'topup' ? '+' : '-'}฿{Number(t.amount).toFixed(0)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: TZ })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Slips ── */}
          {tab === 'slips' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800">รายการแจ้งชำระเงิน</h2>
                  <p className="text-sm text-slate-500 mt-1">ตรวจสอบและอนุมัติสลิปโอนเงินจากผู้ใช้</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                        {['ID', 'รหัสนักศึกษา', 'จำนวนเงิน', 'สถานะ', 'วันที่ทำรายการ'].map(h => (
                          <th key={h} className="px-6 py-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {slips.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">ไม่มีข้อมูลสลิป</td></tr>
                      ) : slips.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs">#{s.id}</td>
                          <td className="px-6 py-4 font-medium text-slate-700">{s.student_id}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">฿{Number(s.amount).toFixed(2)}</td>
                          <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(s.created_at).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {tab === 'users' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800">จัดการผู้ใช้งาน</h2>
                  <p className="text-sm text-slate-500 mt-1">ดูรายชื่อผู้ใช้ ยอดคงเหลือ และจัดการสิทธิ์</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                        {['ผู้ใช้งาน (รหัสนักศึกษา)', 'เครดิตคงเหลือ', 'เพิ่มเครดิต', 'บทบาท (Role)', 'วันที่สมัคร', 'จัดการสิทธิ์'].map(h => (
                          <th key={h} className="px-6 py-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">ไม่มีข้อมูลผู้ใช้งาน</td></tr>
                      ) : users.map((u) => (
                        <tr key={u.student_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-700">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {u.student_id.slice(0, 2)}
                              </div>
                              {u.student_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-indigo-600">฿{Number(u.credit_balance).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="0.00"
                                value={creditInputs[u.student_id] || ''}
                                onChange={(e) => setCreditInputs({ ...creditInputs, [u.student_id]: e.target.value })}
                                className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => addCredit(u.student_id)}
                                disabled={!creditInputs[u.student_id] || Number(creditInputs[u.student_id]) <= 0}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg transition-colors font-medium text-xs shadow-sm shadow-emerald-500/20 disabled:shadow-none"
                              >
                                เพิ่ม
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {u.role === 'admin' && <ShieldIcon className="w-3 h-3" />}
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(u.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: TZ })}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleRole(u.student_id, u.role)}
                              className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                                u.role === 'admin'
                                  ? 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                              }`}
                            >
                              {u.role === 'admin' ? 'ถอดสิทธิ์ Admin' : 'แต่งตั้ง Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Transactions ── */}
          {tab === 'transactions' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800">ประวัติธุรกรรมทั้งหมด</h2>
                  <p className="text-sm text-slate-500 mt-1">ประวัติการเติมเงินและการใช้จ่ายของระบบ</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                        {['Ref ID', 'รหัสนักศึกษา', 'ประเภท', 'จำนวนเงิน', 'รายละเอียด', 'เวลา'].map(h => (
                          <th key={h} className="px-6 py-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {txs.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">ไม่มีประวัติธุรกรรม</td></tr>
                      ) : txs.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">#{t.id}</td>
                          <td className="px-6 py-4 font-medium text-slate-700">{t.student_id}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.type === 'topup' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {t.type === 'topup' ? 'เติมเงิน' : 'ใช้จ่าย'}
                            </span>
                          </td>
                          <td className={`px-6 py-4 font-bold ${t.type === 'topup' ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {t.type === 'topup' ? '+' : '-'}฿{Number(t.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={t.description}>{t.description}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {new Date(t.created_at).toLocaleString('th-TH', { timeZone: TZ })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {tab === 'settings' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    ตั้งค่าระบบ
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">ปรับแต่งค่าตัวแปรต่างๆ ของระบบ เช่น บัญชีธนาคาร หรือ ราคา</p>
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-6">
                    {settings.length === 0 && !loading ? (
                      <div className="text-center text-slate-400 py-4">ไม่มีข้อมูลการตั้งค่า</div>
                    ) : settings.map((s) => (
                      <SettingRow key={s.key_name} setting={s} onSave={saveSetting} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function StatCard({
  title, value, icon: Icon, color, trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'indigo' | 'amber' | 'emerald' | 'red' | 'slate';
  trend?: string;
}) {
  const colorMap = {
    indigo:  { text: 'text-indigo-600',  iconBg: 'bg-indigo-100',  border: 'border-slate-200' },
    amber:   { text: 'text-amber-600',   iconBg: 'bg-amber-100',   border: 'border-amber-200' },
    emerald: { text: 'text-emerald-600', iconBg: 'bg-emerald-100', border: 'border-slate-200' },
    red:     { text: 'text-rose-600',    iconBg: 'bg-rose-100',    border: 'border-rose-200' },
    slate:   { text: 'text-slate-700',   iconBg: 'bg-slate-200',   border: 'border-slate-200' },
  };
  const style = colorMap[color];
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${style.border}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${style.text}`}>{value}</h3>
          {trend && <p className={`text-xs mt-2 font-medium ${color === 'red' ? 'text-rose-500' : 'text-slate-400'}`}>{trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.iconBg}`}>
          <Icon className={`w-6 h-6 ${style.text}`} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending')  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">รอตรวจสอบ</span>;
  if (status === 'approved') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">อนุมัติแล้ว</span>;
  if (status === 'rejected') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200">ปฏิเสธ</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
}

const SETTING_LABELS: Record<string, string> = {
  maintenance_mode:  'โหมดปิดปรับปรุง (Maintenance)',
  price_per_task:    'ราคาต่อ Task (บาท)',
  BANK_NAME:         'ชื่อธนาคาร (ตัวย่อ)',
  BANK_ACCOUNT_NO:   'เลขบัญชีธนาคาร',
  BANK_ACCOUNT_NAME: 'ชื่อบัญชี',
  PRICE_PER_ITEM:    'ราคาต่อ Task (บาท)',
};

const SETTING_DESC: Record<string, string> = {
  maintenance_mode:  'เปิดเพื่อปิดการใช้งานระบบชั่วคราว',
  price_per_task:    'ราคาเครดิตที่หักเมื่อผู้ใช้สั่งรัน Task',
  BANK_NAME:         'เช่น KBANK, SCB, KTB',
  BANK_ACCOUNT_NO:   'ตัวเลขติดกัน ไม่มีขีด',
  BANK_ACCOUNT_NAME: 'ชื่อ-นามสกุล หรือชื่อบริษัท',
};

function SettingRow({ setting, onSave }: { setting: Setting; onSave: (k: string, v: string) => void }) {
  const [val, setVal] = useState(setting.value);
  const [isSaved, setIsSaved] = useState(false);
  const label = SETTING_LABELS[setting.key_name] ?? setting.key_name;
  const desc  = SETTING_DESC[setting.key_name];
  const isMaintenance = setting.key_name === 'maintenance_mode';

  const handleSave = () => {
    onSave(setting.key_name, val);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (isMaintenance) {
    const isOn = val === '1';
    const toggle = () => {
      const next = isOn ? '0' : '1';
      setVal(next);
      onSave(setting.key_name, next);
    };
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div className="mb-3 sm:mb-0">
          <span className="text-base font-semibold text-slate-800 block">{label}</span>
          {desc && <span className="text-sm text-slate-500">{desc}</span>}
        </div>
        <button
          onClick={toggle}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isOn ? 'bg-rose-500' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-3 border-b border-slate-100 last:border-0">
      <div className="mb-2">
        <label className="text-base font-semibold text-slate-800 block">{label}</label>
        {desc && <span className="text-sm text-slate-500">{desc}</span>}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="flex-1 w-full sm:max-w-md border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 font-medium"
        />
        <button
          onClick={handleSave}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            isSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
          }`}
        >
          {isSaved ? <><CheckCircle2 className="w-4 h-4" /> บันทึกแล้ว</> : 'บันทึกการเปลี่ยนแปลง'}
        </button>
      </div>
    </div>
  );
}
