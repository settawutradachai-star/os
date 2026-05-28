'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Subject {
  course_id: string;
  recid?: string;
  open_id?: string;
  name_th?: string;
  name_en?: string;
  code?: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [year, setYear]           = useState<string | null>(null);
  const [term, setTerm]           = useState<string | null>(null);
  const [id_code, setId_code]     = useState<string | null>(null);
  const [full_name, setFull_name] = useState<string | null>(null);
  const [id_class, setId_class]   = useState<string | null>(null);
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [credit, setCredit]       = useState<string>('฿0.00');

  useEffect(() => {
    const y   = localStorage.getItem('year');
    const tm  = localStorage.getItem('term');
    const ic  = localStorage.getItem('id_code');
    const fn  = localStorage.getItem('full_name');
    const idc = localStorage.getItem('id_class');
    const subs: Subject[] = JSON.parse(localStorage.getItem('subjects') || '[]');

    if (!y || !tm || !ic) {
      localStorage.clear();
      router.push('/login');
      return;
    }

    setYear(y);
    setTerm(tm);
    setId_code(ic);
    setFull_name(fn);
    setId_class(idc);
    setSubjects(subs);

    loadNavCredit(ic);
  }, [router]);

  const loadNavCredit = async (student_id: string) => {
    setCredit('฿0.00');
    try {
      const res = await fetch('/api/credit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ student_id }),
      }).then(r => r.json());
      setCredit(`฿${(res.balance ?? 0).toFixed(2)}`);
    } catch {
      setCredit('฿0.00');
    }
  };

  const openCourse = async (sub: Subject) => {
    const nameTh = sub.name_th || sub.name_en || '';
    let recid = sub.recid;

    if (!recid) {
      try {
        const tok = localStorage.getItem('token') ?? '';
        const data = await fetch('/api/courses/register', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token: tok, host_id: 1, open_id: sub.open_id, courseid: sub.course_id }),
        }).then(r => r.json());
        recid = data.recid || data.id || data.open_recid || data.data?.recid || '';
      } catch {
        // register failed
      }
    }

    if (!recid) {
      alert('ไม่สามารถเข้าวิชาได้ กรุณาลองใหม่อีกครั้ง (recid not found)');
      return;
    }

    router.push(`/work?course_id=${sub.course_id}&recid=${recid}&name=${encodeURIComponent(nameTh)}`);
  };

  const doLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-sm">Blueberry</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">{full_name || id_code}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl min-w-[60px] text-center">
              {credit}
            </span>
            <a href="/topup" className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              เติมเงิน
            </a>
            <button onClick={doLogout} className="text-xs text-slate-500 hover:text-red-500 transition flex items-center gap-1 ml-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5 fade-in">
          <h1 className="text-xl font-bold text-slate-800">วิชาของฉัน</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {full_name || id_code} · {id_class || ''} · ปี {year} เทอม {term}
          </p>
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center gap-2 py-16 text-slate-400">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">ไม่พบรายวิชา</p>
            </div>
          ) : (
            subjects.map((sub, i) => {
              const nameTh = sub.name_th || sub.name_en || 'ไม่มีชื่อ';
              const nameEn = sub.name_en || '';
              const code   = sub.code || sub.course_id;

              return (
                <div
                  key={i}
                  role="button"
                  onClick={() => openCourse(sub)}
                  className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4 card-hover cursor-pointer fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm leading-snug truncate">{nameTh}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{nameEn}</p>
                    <div className="mt-1.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        รหัส {code}
                      </span>
                    </div>
                  </div>

                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        * { font-family: 'IBM Plex Sans Thai', sans-serif; }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>
    </div>
  );
}
