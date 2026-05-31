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
  [key: string]: any;
}

interface Item {
  itemid: string | number;
  title: string;
  item_type: 'Q' | 'M';
  lesson_type: string;
  can_view: string;
  view_success: string;
  stu_score?: number | null;
  item_score?: number | null;
  lessonid?: string | number;
  [key: string]: any;
}

interface Chapter {
  title: string;
  child: Item[];
}

interface CoursePreview {
  sub: Subject;
  recid: string;
  items: Item[];      // all undone items
  newItems: Item[];   // items not yet in paid_tasks
  paidItemIds: string[];
}

export default function CoursesPage() {
  const router = useRouter();
  const [year, setYear]           = useState<string | null>(null);
  const [term, setTerm]           = useState<string | null>(null);
  const [id_code, setId_code]     = useState<string | null>(null);
  const [full_name, setFull_name] = useState<string | null>(null);
  const [id_class, setId_class]   = useState<string | null>(null);
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [userRole, setUserRole]     = useState<string>('user');
  const [resellerId, setResellerId] = useState<string | null>(null);

  const [selectMode, setSelectMode]   = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isRunning, setIsRunning]   = useState(false);
  const [autoStatus, setAutoStatus] = useState('');

  const [showAutoModal, setShowAutoModal]       = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [autoPreview, setAutoPreview] = useState<{
    courses: CoursePreview[];
    totalNew: number;
    totalCost: number;
    pricePerTask: number;
  } | null>(null);

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
    const role = localStorage.getItem('user_role') ?? 'user';
    setUserRole(role);
    setResellerId(localStorage.getItem('reseller_id'));
    loadNavCredit(ic);
  }, [router]);

  // Navigation protection while running
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isRunning) return;
      e.preventDefault();
    };
    const handlePopState = () => {
      if (!isRunning) return;
      const ok = window.confirm('ระบบกำลังทำงานอยู่ ถ้าออกจากหน้านี้งานจะหยุด แน่ใจหรือไม่?');
      if (!ok) window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isRunning]);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const isItemDone = (item: Item) =>
    item.view_success === 'Y' ||
    (item.item_type === 'Q' &&
      typeof item.stu_score === 'number' &&
      typeof item.item_score === 'number' &&
      item.item_score > 0 &&
      item.stu_score >= item.item_score);

  const loadNavCredit = async (student_id: string) => {
    try {
      const res = await fetch('/api/credit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ student_id }),
      }).then(r => r.json());
      setCreditBalance(res.balance ?? 0);
    } catch {
      setCreditBalance(0);
    }
  };

  const openCourse = async (sub: Subject) => {
    if (selectMode) { toggleSelect(String(sub.course_id)); return; }

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
      } catch {}
    }

    if (!recid) {
      alert('ไม่สามารถเข้าวิชาได้ กรุณาลองใหม่อีกครั้ง (recid not found)');
      return;
    }

    router.push(`/work?course_id=${sub.course_id}&recid=${recid}&name=${encodeURIComponent(nameTh)}`);
  };

  const toggleSelect = (courseId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId); else next.add(courseId);
      return next;
    });
  };

  const selectAll  = () => setSelectedIds(new Set(subjects.map(s => String(s.course_id))));
  const selectNone = () => setSelectedIds(new Set());

  const doLogout = () => { localStorage.clear(); router.push('/login'); };

  // ── Build preview data before showing modal ───────────────────────────────

  const prepareAutoPreview = async () => {
    const tok       = localStorage.getItem('token') ?? '';
    const studentId = localStorage.getItem('id_code') ?? '';
    const selected  = subjects.filter(s => selectedIds.has(String(s.course_id)));
    if (selected.length === 0) return;

    setIsLoadingPreview(true);
    const courses: CoursePreview[] = [];
    let pricePerTask = 1;

    for (const sub of selected) {
      try {
        let recid = sub.recid ?? '';
        if (!recid) {
          const reg = await fetch('/api/courses/register', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ token: tok, host_id: 1, open_id: sub.open_id, courseid: sub.course_id }),
          }).then(r => r.json());
          recid = reg.recid || reg.id || reg.open_recid || reg.data?.recid || '';
        }
        if (!recid) continue;

        const [chaptersRaw, creditRes] = await Promise.all([
          fetch(`/api/chapters?course_id=${sub.course_id}&recid=${recid}&token=${encodeURIComponent(tok)}`).then(r => r.json()),
          fetch('/api/credit', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ student_id: studentId, course_id: parseInt(sub.course_id) }),
          }).then(r => r.json()),
        ]);

        pricePerTask = creditRes.price_per_task ?? pricePerTask;
        const paidItemIds: string[] = (creditRes.paid_items ?? []).map(String);

        const chapters: Chapter[] = Array.isArray(chaptersRaw) ? chaptersRaw : [];
        const allItems = chapters.flatMap(ch => ch.child || []);
        const items    = allItems.filter(i => !isItemDone(i));
        const newItems = items.filter(i => !paidItemIds.includes(String(i.itemid)));

        courses.push({ sub, recid, items, newItems, paidItemIds });
      } catch {}
    }

    const totalNew  = courses.reduce((s, c) => s + c.newItems.length, 0);
    const totalCost = pricePerTask * totalNew;

    setAutoPreview({ courses, totalNew, totalCost, pricePerTask });
    setIsLoadingPreview(false);
    setShowAutoModal(true);
  };

  // ── Run auto across all selected courses ──────────────────────────────────

  const runAutoAll = async () => {
    if (!autoPreview) return;
    setShowAutoModal(false);
    setSelectMode(false);
    setIsRunning(true);

    const tok       = localStorage.getItem('token') ?? '';
    const studentId = localStorage.getItem('id_code') ?? '';

    for (const { sub, recid, items, newItems } of autoPreview.courses) {
      const courseId   = String(sub.course_id);
      const openid     = sub.open_id;
      const courseName = sub.name_th || sub.name_en || courseId;

      // Charge for new (unpaid) items
      if (newItems.length > 0) {
        const spendRes = await fetch('/api/spend', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            task_count: newItems.length,
            course_id:  parseInt(courseId),
            item_ids:   newItems.map(i => i.itemid),
            ...(resellerId ? { reseller_student_id: resellerId } : {}),
          }),
        }).then(r => r.json()).catch(() => ({ success: false }));

        if (!spendRes.success) {
          setAutoStatus(`❌ ข้าม ${courseName} — ${spendRes.error === 'insufficient_credit' ? 'เครดิตไม่พอ' : 'เกิดข้อผิดพลาด'}`);
          if (spendRes.balance != null) setCreditBalance(spendRes.balance);
          await sleep(1000);
          continue;
        }
        setCreditBalance(spendRes.new_balance ?? creditBalance);
      }

      const mediaItems = items.filter(i => i.item_type === 'M');
      const quizzes    = items.filter(i => i.item_type === 'Q');
      const total      = mediaItems.length + quizzes.length;
      let done = 0;

      for (const item of mediaItems) {
        setAutoStatus(`กำลังทำ: ${courseName} (${done + 1}/${total})`);
        try {
          const lessons = await fetch(
            `/api/lessons?itemid=${item.itemid}&recid=${recid}&token=${encodeURIComponent(tok)}`
          ).then(r => r.json());

          if (Array.isArray(lessons) && lessons.length > 0) {
            for (const lesson of lessons) {
              const isPDF    = lesson.lesson_type === 'F';
              const isVDO    = lesson.lesson_type === 'Y';
              const duration = isVDO ? (lesson.lenght_vdo || lesson.duration || 60) : (Math.floor(Math.random() * 46) + 45);
              await sleep(isPDF ? 1000 : 500);
              await fetch('/api/progress', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: tok,
                  recid: Number(recid), openid, student_id: studentId,
                  itemid: lesson.itemid, lessonid: lesson.lessonid,
                  lesson_type: lesson.lesson_type, item_type: 'M',
                  courseid: Number(courseId), full_time: duration, view_time: duration, percent: 100,
                }),
              }).then(r => r.json()).catch(() => {});
              await sleep(200);
            }
          } else {
            const dur = Math.floor(Math.random() * 46) + 45;
            await sleep(1000);
            await fetch('/api/progress', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: tok,
                recid: Number(recid), openid, student_id: studentId,
                itemid: item.itemid, lessonid: item.lessonid || item.itemid,
                lesson_type: item.lesson_type, item_type: 'M',
                courseid: Number(courseId), full_time: dur, view_time: dur, percent: 100,
              }),
            }).then(r => r.json()).catch(() => {});
          }
        } catch {}
        done++;
        await sleep(200);
      }

      for (const item of quizzes) {
        setAutoStatus(`กำลังทำ: ${courseName} (${done + 1}/${total})`);
        try {
          const result = await fetch('/api/quiz/answer', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: tok, itemid: item.itemid,
              recid, openid, course_id: courseId, student_id: studentId,
            }),
          }).then(r => r.json());

          if (!result.skipped) {
            await fetch('/api/progress', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: tok,
                recid: Number(recid), openid, student_id: studentId,
                itemid: item.itemid, lessonid: '',
                lesson_type: item.lesson_type || 'Post', item_type: 'Q',
                courseid: Number(courseId), full_time: 0, view_time: 19, percent: 100,
              }),
            }).catch(() => {});
          }
        } catch {}
        done++;
        await sleep(200);
      }

      await fetch('/api/mark-ran', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_id:  parseInt(courseId),
          item_ids:   items.map(i => i.itemid),
        }),
      }).catch(() => {});

      await sleep(500);
    }

    setIsRunning(false);
    setAutoStatus('✓ เสร็จทุกวิชาแล้ว!');
    if (id_code) loadNavCredit(id_code);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Running banner — fixed, intentionally covers nav while auto is active */}
      {isRunning && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600 text-white text-xs font-medium px-4 py-2 flex items-center gap-2">
          <svg className="w-3 h-3 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
          </svg>
          <span>กำลังทำงานอยู่ อย่าปิดหน้านี้</span>
        </div>
      )}

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
              ฿{creditBalance.toFixed(2)}
            </span>
            {userRole === 'reseller' && (
              <a href="/reseller" className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                ทำงานให้ลูกค้า
              </a>
            )}
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

      {/* Reseller mode banner — sits in content flow, naturally below navbar */}
      {resellerId && (
        <div className="bg-amber-500 text-white text-xs font-medium px-4 py-2 flex items-center justify-between">
          <span>โหมดตัวแทน — ลูกค้า: <strong>{id_code}</strong> · เรียกเก็บจาก: <strong>{resellerId}</strong></span>
          <button
            onClick={() => {
              const resellerToken  = localStorage.getItem('reseller_token');
              const resellerId     = localStorage.getItem('reseller_id');
              const resellerOpenid = localStorage.getItem('reseller_openid');
              const resellerRecid  = localStorage.getItem('reseller_recid');
              const resellerName   = localStorage.getItem('reseller_name');

              if (resellerToken)  localStorage.setItem('token',      resellerToken);
              if (resellerId)     localStorage.setItem('student_id', resellerId);
              if (resellerId)     localStorage.setItem('id_code',    resellerId);
              if (resellerOpenid) localStorage.setItem('openid',     resellerOpenid);
              if (resellerRecid)  localStorage.setItem('recid',      resellerRecid);
              if (resellerName)   localStorage.setItem('full_name',  resellerName);

              localStorage.removeItem('reseller_token');
              localStorage.removeItem('reseller_id');
              localStorage.removeItem('reseller_openid');
              localStorage.removeItem('reseller_recid');
              localStorage.removeItem('reseller_name');

              setResellerId(null);
              router.push('/reseller');
            }}
            className="text-white/80 hover:text-white underline text-xs ml-4 flex-shrink-0"
          >
            เปลี่ยนลูกค้า
          </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header row */}
        <div className="mb-5 fade-in flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">วิชาของฉัน</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {full_name || id_code} · {id_class || ''} · ปี {year} เทอม {term}
            </p>
          </div>
          {!isRunning && (
            <button
              onClick={() => { setSelectMode(m => !m); setSelectedIds(new Set()); }}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition flex-shrink-0 ${
                selectMode ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {selectMode ? 'ยกเลิก' : 'เลือกวิชา'}
            </button>
          )}
        </div>

        {/* Select-mode toolbar */}
        {selectMode && !isRunning && (
          <div className="mb-4 flex items-center gap-2 fade-in">
            <button onClick={selectAll} className="text-xs font-medium px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
              เลือกทั้งหมด
            </button>
            <button onClick={selectNone} className="text-xs font-medium px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
              ยกเลิกทั้งหมด
            </button>
            <button
              onClick={prepareAutoPreview}
              disabled={selectedIds.size === 0 || isLoadingPreview}
              className="ml-auto text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white transition flex items-center gap-1.5"
            >
              {isLoadingPreview ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  กำลังโหลด...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Auto {selectedIds.size} วิชาที่เลือก
                </>
              )}
            </button>
          </div>
        )}

        {/* Status line */}
        {autoStatus && (
          <p className="text-xs font-medium mb-4 fade-in text-indigo-600">{autoStatus}</p>
        )}

        {/* Course grid */}
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
              const nameTh     = sub.name_th || sub.name_en || 'ไม่มีชื่อ';
              const nameEn     = sub.name_en || '';
              const code       = sub.code || sub.course_id;
              const isSelected = selectedIds.has(String(sub.course_id));

              return (
                <div
                  key={i}
                  role="button"
                  onClick={() => openCourse(sub)}
                  className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 card-hover cursor-pointer fade-in ${
                    isSelected ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-100'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {selectMode ? (
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}

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

      {/* Auto confirmation modal */}
      {showAutoModal && autoPreview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 fade-in max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg mb-1">ยืนยัน Auto All Courses</h3>
            <p className="text-sm text-slate-500 mb-4">ระบบจะหักเครดิตและทำงานให้อัตโนมัติทุกวิชาที่เลือก</p>

            <div className="space-y-2 mb-4">
              {autoPreview.courses.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                  <span className="text-sm text-slate-700 truncate mr-2">
                    {c.sub.name_th || c.sub.name_en || c.sub.course_id}
                  </span>
                  <span className="text-xs font-medium text-slate-500 flex-shrink-0">{c.newItems.length} tasks</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ราคาต่อ task</span>
                <span className="font-semibold text-slate-800">{autoPreview.pricePerTask} บาท</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tasks ทั้งหมด</span>
                <span className="font-semibold text-slate-800">{autoPreview.totalNew}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-700">รวม</span>
                <span className="text-indigo-600">{autoPreview.totalCost.toFixed(2)} บาท</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">เครดิตหลังหัก</span>
                <span className={creditBalance - autoPreview.totalCost >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-500'}>
                  {(creditBalance - autoPreview.totalCost).toFixed(2)} บาท
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAutoModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition">
                ยกเลิก
              </button>
              <button
                onClick={runAutoAll}
                disabled={autoPreview.totalNew === 0}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm transition"
              >
                {autoPreview.totalNew === 0 ? 'ไม่มี tasks' : 'ยืนยัน & Auto'}
              </button>
            </div>
            <a href="/topup" className="block text-center text-xs text-indigo-500 hover:underline mt-3">เติมเครดิต →</a>
          </div>
        </div>
      )}

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
