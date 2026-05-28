'use client';

import { useEffect, useRef, useState } from 'react';

type Tab = 'dashboard' | 'slips' | 'users' | 'transactions' | 'settings';

interface Stats {
  total_revenue: number;
  pending_slips: number;
  total_users:   number;
  tasks_today:   number;
  stuck_tasks:   number;
}

interface DashboardData {
  stats:               Stats;
  revenue_chart:       { date: string; total: number }[];
  recent_transactions: RecentTx[];
}

interface RecentTx {
  id:          number;
  student_id:  string;
  type:        string;
  amount:      number;
  description: string;
  status:      string;
  created_at:  string;
}

interface Slip {
  id:          number;
  student_id:  string;
  amount:      number;
  status:      string;
  created_at:  string;
}

interface User {
  student_id:     string;
  credit_balance: number;
  role:           string;
  created_at:     string;
}

interface Tx {
  id:          number;
  student_id:  string;
  type:        string;
  amount:      number;
  description: string;
  status:      string;
  created_at:  string;
}

interface Setting {
  key_name: string;
  value:    string;
}

export default function AdminPage() {
  const [authed, setAuthed]   = useState(false);
  const [token, setToken]     = useState('');
  const [stdId, setStdId]     = useState('');
  const [pw, setPw]           = useState('');
  const [authErr, setAuthErr] = useState('');
  const [tab, setTab]         = useState<Tab>('dashboard');

  const [dashboard, setDashboard]   = useState<DashboardData | null>(null);
  const [slips, setSlips]           = useState<Slip[]>([]);
  const [users, setUsers]           = useState<User[]>([]);
  const [txs, setTxs]               = useState<Tx[]>([]);
  const [settings, setSettings]     = useState<Setting[]>([]);
  const [loading, setLoading]       = useState(false);

  const chartRef    = useRef<HTMLCanvasElement>(null);
  const refreshRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const hdr = (tok: string) => ({
    'Authorization': `Bearer ${tok}`,
    'Content-Type':  'application/json',
  });

  // On mount — check stored token
  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    if (!stored) return;
    fetch('/api/admin/auth', { headers: { 'Authorization': `Bearer ${stored}` } })
      .then(r => r.json())
      .then(d => {
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

  // Auto-refresh dashboard every 30s
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (!authed || tab !== 'dashboard' || !token) return;
    refreshRef.current = setInterval(() => {
      fetch('/api/admin/dashboard', { headers: hdr(token) })
        .then(r => r.json())
        .then(d => setDashboard(d))
        .catch(() => {});
    }, 30_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [authed, tab, token]);

  // Render Chart.js bar chart when dashboard data arrives
  useEffect(() => {
    if (!dashboard || tab !== 'dashboard') return;
    const doRender = () => {
      const canvas = chartRef.current;
      if (!canvas) return;
      const Chart = (window as any).Chart;
      if (!Chart) return;
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels:   dashboard.revenue_chart.map(d => d.date.slice(5)),
          datasets: [{
            label:           'ยอดเติม (฿)',
            data:            dashboard.revenue_chart.map(d => d.total),
            backgroundColor: 'rgba(99,102,241,0.75)',
            borderRadius:    6,
          }],
        },
        options: {
          responsive: true,
          plugins:    { legend: { display: false } },
          scales:     { y: { beginAtZero: true, ticks: { callback: (v: number) => `฿${v}` } } },
        },
      });
    };
    if ((window as any).Chart) { doRender(); return; }
    const existing = document.getElementById('chartjs-cdn');
    if (existing) { existing.addEventListener('load', doRender); return; }
    const el = document.createElement('script');
    el.id  = 'chartjs-cdn';
    el.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    el.onload = doRender;
    document.head.appendChild(el);
  }, [dashboard, tab]);

  async function doLoad(t: Tab, tok: string) {
    setLoading(true);
    try {
      if (t === 'dashboard') {
        const d = await fetch('/api/admin/dashboard', { headers: hdr(tok) }).then(r => r.json());
        setDashboard(d);
      } else if (t === 'slips') {
        const d = await fetch('/api/admin/slips', { headers: hdr(tok) }).then(r => r.json());
        setSlips(d.slips ?? []);
      } else if (t === 'users') {
        const d = await fetch('/api/admin/users', { headers: hdr(tok) }).then(r => r.json());
        setUsers(d.users ?? []);
      } else if (t === 'transactions') {
        const d = await fetch('/api/admin/transactions', { headers: hdr(tok) }).then(r => r.json());
        setTxs(d.transactions ?? []);
      } else if (t === 'settings') {
        const d = await fetch('/api/admin/settings', { headers: hdr(tok) }).then(r => r.json());
        setSettings(d.settings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setAuthErr('');
    const res  = await fetch('/api/admin/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: pw, student_id: stdId.trim() }),
    });
    const data = await res.json();
    if (res.status === 401) { setAuthErr('รหัสผ่านไม่ถูกต้อง'); return; }
    if (res.status === 403) { setAuthErr('บัญชีนี้ไม่มีสิทธิ์ admin'); return; }
    if (!res.ok || !data.token) { setAuthErr('เกิดข้อผิดพลาด กรุณาลองใหม่'); return; }
    localStorage.setItem('admin_token', data.token);
    setToken(data.token);
    setAuthed(true);
    doLoad('dashboard', data.token);
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
  }

  async function approveSlip(id: number) {
    await fetch(`/api/admin/slips?id=${id}`, { method: 'PATCH', headers: hdr(token), body: JSON.stringify({ status: 'approved' }) });
    doLoad('slips', token);
  }

  async function rejectSlip(id: number) {
    await fetch(`/api/admin/slips?id=${id}`, { method: 'PATCH', headers: hdr(token), body: JSON.stringify({ status: 'rejected' }) });
    doLoad('slips', token);
  }

  async function saveSetting(key: string, value: string) {
    await fetch('/api/admin/settings', { method: 'POST', headers: hdr(token), body: JSON.stringify({ key_name: key, value }) });
    doLoad('settings', token);
  }

  async function toggleRole(student_id: string, currentRole: string) {
    const role = currentRole === 'admin' ? 'user' : 'admin';
    await fetch('/api/admin/users', { method: 'PATCH', headers: hdr(token), body: JSON.stringify({ action: 'set_role', student_id, role }) });
    doLoad('users', token);
  }

  // ── Login gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="font-bold text-slate-800">Admin</h1>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={stdId}
              onChange={e => setStdId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="รหัสนักศึกษา"
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="รหัสผ่าน admin"
              className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {authErr && <p className="text-xs text-red-500">{authErr}</p>}
            <button
              onClick={login}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'slips',        label: 'สลิป' },
    { id: 'users',        label: 'ผู้ใช้' },
    { id: 'transactions', label: 'ธุรกรรม' },
    { id: 'settings',     label: 'ตั้งค่า' },
  ];

  const stats = dashboard?.stats;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm">🫐 Admin</span>
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1.5 ${tab === t.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                {t.label}
                {t.id === 'slips' && (stats?.pending_slips ?? 0) > 0 && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {stats?.pending_slips}
                  </span>
                )}
                {t.id === 'dashboard' && (stats?.stuck_tasks ?? 0) > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {stats?.stuck_tasks}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <button onClick={logout} className="text-xs text-white/50 hover:text-white transition-colors">
          ออกจากระบบ
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
            กำลังโหลด...
          </div>
        )}

        {/* ── Dashboard ───────────────────────────────────────────────────── */}
        {tab === 'dashboard' && !dashboard && !loading && (
          <div className="text-slate-400 text-sm py-8 text-center">ไม่สามารถโหลดข้อมูลได้</div>
        )}
        {tab === 'dashboard' && dashboard && stats && (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatCard label="รายได้รวม" value={`฿${(stats.total_revenue ?? 0).toFixed(2)}`} color="indigo" />
              <StatCard label="สลิปรอตรวจ" value={stats.pending_slips ?? 0} color={(stats.pending_slips ?? 0) > 0 ? 'yellow' : 'slate'} />
              <StatCard label="ผู้ใช้ทั้งหมด" value={stats.total_users ?? 0} color="slate" />
              <StatCard label="งานวันนี้" value={stats.tasks_today ?? 0} color="green" />
              <StatCard
                label="งานค้าง"
                value={stats.stuck_tasks ?? 0}
                color={(stats.stuck_tasks ?? 0) > 0 ? 'red' : 'slate'}
                badge={(stats.stuck_tasks ?? 0) > 0}
              />
            </div>

            {/* Revenue chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">ยอดเติมเงิน 7 วันที่ผ่านมา</h2>
              <canvas ref={chartRef} height={80} />
            </div>

            {/* Recent transactions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">ธุรกรรมล่าสุด</h2>
                <span className="text-xs text-slate-400">10 รายการล่าสุด · รีเฟรชทุก 30 วิ</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr>
                    {['รหัสนักศึกษา', 'ประเภท', 'จำนวน', 'รายละเอียด', 'เวลา'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dashboard.recent_transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{t.student_id}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === 'topup' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 font-medium text-sm ${t.type === 'topup' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'topup' ? '+' : '-'}฿{Number(t.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[180px] truncate">{t.description}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{new Date(t.created_at).toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Slips ───────────────────────────────────────────────────────── */}
        {tab === 'slips' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  {['ID', 'รหัสนักศึกษา', 'จำนวน', 'สถานะ', 'วันที่', 'จัดการ'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {slips.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.student_id}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">฿{Number(s.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                        s.status === 'approved' ? 'bg-green-100 text-green-700'  :
                                                  'bg-red-100 text-red-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(s.created_at).toLocaleString('th-TH')}</td>
                    <td className="px-4 py-3">
                      {s.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => approveSlip(s.id)} className="text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded transition-colors">อนุมัติ</button>
                          <button onClick={() => rejectSlip(s.id)}  className="text-xs bg-red-500  hover:bg-red-600  text-white px-2.5 py-1 rounded transition-colors">ปฏิเสธ</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Users ───────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  {['รหัสนักศึกษา', 'เครดิต', 'Role', 'สมัครเมื่อ', 'จัดการ'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.student_id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {u.role === 'admin' && <span className="mr-1">👑</span>}
                      {u.student_id}
                    </td>
                    <td className="px-4 py-3 text-indigo-600 font-medium">฿{Number(u.credit_balance).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.created_at).toLocaleString('th-TH')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRole(u.student_id, u.role)}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          u.role === 'admin'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                        }`}
                      >
                        {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Transactions ────────────────────────────────────────────────── */}
        {tab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  {['ID', 'รหัสนักศึกษา', 'ประเภท', 'จำนวน', 'รายละเอียด', 'วันที่'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {txs.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-400 text-xs">{t.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.student_id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === 'topup' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${t.type === 'topup' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'topup' ? '+' : '-'}฿{Number(t.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{t.description}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(t.created_at).toLocaleString('th-TH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Settings ────────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-col gap-4">
              {settings.map(s => (
                <SettingRow key={s.key_name} setting={s} onSave={saveSetting} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, color, badge = false,
}: {
  label:  string;
  value:  string | number;
  color:  'indigo' | 'yellow' | 'green' | 'red' | 'slate';
  badge?: boolean;
}) {
  const colors = {
    indigo: 'text-indigo-600',
    yellow: 'text-yellow-600',
    green:  'text-green-600',
    red:    'text-red-500',
    slate:  'text-slate-700',
  };
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 ${badge ? 'border-red-200' : 'border-slate-100'}`}>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

const SETTING_LABELS: Record<string, string> = {
  maintenance_mode:  'โหมดปิดปรับปรุง',
  price_per_task:    'ราคาต่อ task (บาท)',
  BANK_NAME:         'ชื่อธนาคาร',
  BANK_ACCOUNT_NO:   'เลขบัญชี',
  BANK_ACCOUNT_NAME: 'ชื่อบัญชี',
  PRICE_PER_ITEM:    'ราคาต่อ task (บาท)',
};

function SettingRow({ setting, onSave }: { setting: Setting; onSave: (k: string, v: string) => void }) {
  const [val, setVal] = useState(setting.value);
  const label = SETTING_LABELS[setting.key_name] ?? setting.key_name;
  const isMaintenance = setting.key_name === 'maintenance_mode';

  if (isMaintenance) {
    const isOn = val === '1';
    const toggle = () => {
      const next = isOn ? '0' : '1';
      setVal(next);
      onSave(setting.key_name, next);
    };
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <button
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOn ? 'bg-red-500' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-600 w-52 flex-shrink-0">{label}</span>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={() => onSave(setting.key_name, val)}
        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors"
      >
        บันทึก
      </button>
    </div>
  );
}
