'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResellerPage() {
  const router = useRouter();
  const [custId, setCustId]   = useState('');
  const [custPw, setCustPw]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resellerName, setResellerName] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'reseller') { router.push('/courses'); return; }
    // At this point student_id is always the reseller's own ID (restored on เปลี่ยนลูกค้า)
    setResellerName(
      localStorage.getItem('reseller_name') ||
      localStorage.getItem('full_name') ||
      localStorage.getItem('student_id') ||
      ''
    );
  }, [router]);

  const doLogin = async () => {
    if (!custId.trim() || !custPw.trim()) { setError('กรุณากรอกข้อมูลให้ครบ'); return; }
    setLoading(true);
    setError('');

    const resellerId = localStorage.getItem('student_id') || localStorage.getItem('id_code') || '';

    try {
      const res = await fetch('/api/reseller/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          customer_student_id: custId.trim(),
          customer_password:   custPw.trim(),
          reseller_student_id: resellerId,
        }),
      }).then(r => r.json());

      if (!res.success) { setError(res.message ?? 'เกิดข้อผิดพลาด'); setLoading(false); return; }

      // Backup all four reseller keys before overwriting with customer data
      localStorage.setItem('reseller_token',  localStorage.getItem('token')  ?? '');
      localStorage.setItem('reseller_id',     resellerId);
      localStorage.setItem('reseller_openid', localStorage.getItem('openid') ?? '');
      localStorage.setItem('reseller_recid',  localStorage.getItem('recid')  ?? '');
      localStorage.setItem('reseller_name',   localStorage.getItem('full_name') ?? '');

      // Overwrite session with customer data
      localStorage.setItem('token',      res.token);
      localStorage.setItem('id_code',    res.student_id);
      localStorage.setItem('student_id', res.student_id);
      localStorage.setItem('year',       res.year ?? '');
      localStorage.setItem('term',       res.term ?? '');

      // Fetch customer's courses
      const coursesRes = await fetch(
        `/api/courses?year=${encodeURIComponent(res.year)}&term=${encodeURIComponent(res.term)}&id_code=${encodeURIComponent(res.student_id)}&token=${encodeURIComponent(res.token)}`
      ).then(r => r.json());

      localStorage.setItem('subjects', JSON.stringify(coursesRes.subjects ?? []));
      if (coursesRes.student?.full_name) localStorage.setItem('full_name', coursesRes.student.full_name);
      if (coursesRes.student?.id_class)  localStorage.setItem('id_class',  coursesRes.student.id_class);

      router.push('/courses');
    } catch (e: any) {
      setError('เกิดข้อผิดพลาด: ' + (e.message || e));
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500 mb-5 shadow-lg shadow-amber-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">เข้าระบบในนามลูกค้า</h1>
          <p className="text-slate-500 mt-1 text-sm">ตัวแทน: {resellerName}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">รหัสนักศึกษาลูกค้า</label>
              <input
                type="text"
                placeholder="เช่น 6811........."
                value={custId}
                onChange={e => setCustId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">รหัสผ่านลูกค้า (e-ed)</label>
              <input
                type="password"
                placeholder="รหัสผ่าน"
                value={custPw}
                onChange={e => setCustPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
            )}

            <button
              onClick={doLogin}
              disabled={loading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] disabled:bg-amber-300 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              {loading ? 'กำลังโหลด...' : 'เริ่มทำงาน'}
            </button>

            <button
              onClick={() => router.push('/courses')}
              className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-sm transition"
            >
              ← กลับหน้าวิชาของฉัน
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        * { font-family: 'IBM Plex Sans Thai', sans-serif; }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
