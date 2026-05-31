'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Chapter {
  title: string;
  child: Item[];
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

function WorkContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const courseId    = params.get('course_id') ?? '';
  const recid       = params.get('recid') ?? '';
  const name        = decodeURIComponent(params.get('name') ?? `วิชา #${courseId}`);

  const [token, setToken]               = useState<string | null>(null);
  const [resellerId, setResellerId]     = useState<string | null>(null);
  const [chapters, setChapters]         = useState<Chapter[]>([]);
  const [loading, setLoading]           = useState(true);
  const [credit, setCredit]             = useState(0);
  const [pricePerTask, setPricePerTask] = useState(1);
  const [paidItems, setPaidItems]       = useState<Set<string | number>>(new Set());
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});
  const [allRunning, setAllRunning]     = useState(false);
  const pendingSelectAll = useRef<boolean | null>(null);
  const hasResumed       = useRef(false);
  const hasCleanedUp     = useRef(false);
  const [autoStatus, setAutoStatus]     = useState('');
  const [autoProgress, setAutoProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setResellerId(localStorage.getItem('reseller_id'));
    if (!courseId || !recid) { router.push('/courses'); return; }
    fetchChapters();
    loadCredit();
  }, [courseId, recid, router]);

  // Warn before navigating away while auto is running (2A)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!allRunning) return;
      e.preventDefault();
    };
    const handlePopState = () => {
      if (!allRunning) return;
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
  }, [allRunning]);

  // Silently clean up paid_tasks for items already completed in e-ed (2C)
  useEffect(() => {
    if (hasCleanedUp.current || chapters.length === 0 || paidItems.size === 0) return;
    const studentId = localStorage.getItem('id_code');
    const allItems = chapters.flatMap(ch => ch.child || []);
    const completedPaidItems = allItems
      .filter(item => item.view_success === 'Y' && paidItems.has(String(item.itemid)))
      .map(item => item.itemid);
    if (completedPaidItems.length === 0) return;
    hasCleanedUp.current = true;
    fetch('/api/mark-ran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, course_id: parseInt(courseId), item_ids: completedPaidItems }),
    }).catch(() => {});
    setPaidItems(prev => {
      const next = new Set(prev);
      completedPaidItems.forEach(id => next.delete(String(id)));
      return next;
    });
  }, [chapters, paidItems]);

  // After chapters expand/collapse, apply any pending selectAll
  useEffect(() => {
    if (pendingSelectAll.current === null) return;
    const checked = pendingSelectAll.current;
    pendingSelectAll.current = null;
    (document.querySelectorAll('.task-checkbox') as NodeListOf<HTMLInputElement>)
      .forEach(cb => { cb.checked = checked; });
  }, [openChapters]);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const isItemDone = (item: Item) =>
    item.view_success === 'Y' ||
    (item.item_type === 'Q' &&
      typeof item.stu_score === 'number' &&
      typeof item.item_score === 'number' &&
      item.item_score > 0 &&
      item.stu_score >= item.item_score);

  // Resume any paid-but-unrun tasks after page load
  useEffect(() => {
    if (hasResumed.current || paidItems.size === 0 || chapters.length === 0 || allRunning) return;
    hasResumed.current = true;
    const studentId = localStorage.getItem('id_code');
    const allPaidIds = Array.from(paidItems).map(String);

    (async () => {
      // Re-fetch to get the latest view_success before deciding what to run
      const freshChapters = await fetchChapters();
      const freshItems = freshChapters.flatMap(ch => ch.child || []);

      const toResume = freshItems.filter(item =>
        allPaidIds.includes(String(item.itemid)) && !isItemDone(item)
      );

      // Mark ALL paid items as ran in DB to clear stale entries
      await fetch('/api/mark-ran', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_id: parseInt(courseId), item_ids: allPaidIds }),
      }).catch(() => {});
      setPaidItems(new Set());

      if (toResume.length === 0) {
        showToast('วิชานี้เสร็จแล้ว ✓', 'emerald');
        return;
      }

      showToast(`▶ กำลังดำเนินการต่อ ${toResume.length} tasks ที่ค้างอยู่`, 'emerald');
      await doAll(toResume.map(i => i.itemid), freshChapters);
    })();
  }, [paidItems, chapters]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchChapters = async (): Promise<Chapter[]> => {
    const tok = localStorage.getItem('token') ?? '';
    try {
      const result = await fetch(`/api/chapters?course_id=${courseId}&recid=${recid}&token=${encodeURIComponent(tok)}`).then(r => r.json());
      if (!Array.isArray(result)) { setChapters([]); setLoading(false); return []; }
      setChapters(result);
      return result;
    } catch {
      setChapters([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadCredit = async () => {
    const studentId = localStorage.getItem('id_code');
    if (!studentId) return;
    try {
      const res = await fetch('/api/credit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ student_id: studentId, course_id: parseInt(courseId) }),
      }).then(r => r.json());

      if (res.maintenance) {
        document.body.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-slate-50"><div class="text-center p-8"><div class="text-5xl mb-4">🔧</div><h1 class="text-xl font-bold text-slate-800">ระบบปิดปรับปรุงชั่วคราว</h1><p class="text-slate-500 mt-2">กรุณากลับมาใหม่ในภายหลัง</p></div></div>`;
        return;
      }
      setCredit(res.balance ?? 0);
      // Use reseller price if in reseller mode
      const isReseller = !!localStorage.getItem('reseller_id');
      setPricePerTask(isReseller ? (res.price_per_task_reseller ?? 0.50) : (res.price_per_task ?? 1));
      setPaidItems(new Set((res.paid_items ?? []).map(String)));
    } catch {
      setCredit(0);
    }
  };

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = (msg: string, color: 'emerald' | 'red' = 'emerald') => {
    const colors = { emerald: 'bg-emerald-600 text-white', red: 'bg-red-600 text-white' };
    const t = document.createElement('div');
    t.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg ${colors[color]} fade-in`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  };

  // ── Progress helpers ──────────────────────────────────────────────────────

  const getProgress = (items: Item[]) => {
    const trackable = items.filter(i => i.item_type === 'Q' || i.item_type === 'M');
    if (trackable.length === 0) return null;
    return Math.round((trackable.filter(i => i.view_success === 'Y').length / trackable.length) * 100);
  };

  const toggleChapter = (i: number) =>
    setOpenChapters(prev => ({ ...prev, [i]: !prev[i] }));

  const getSummary = () => {
    let totalScore = 0, maxScore = 0, doneTasks = 0, totalTasks = 0;
    chapters.forEach(ch => {
      (ch.child || []).forEach(item => {
        if (item.item_type === 'Q') {
          totalScore += item.stu_score || 0;
          maxScore   += item.item_score || 0;
          totalTasks++;
          if (item.view_success === 'Y') doneTasks++;
        } else if (item.item_type === 'M') {
          totalTasks++;
          if (item.view_success === 'Y') doneTasks++;
        }
      });
    });
    return { totalScore, maxScore, doneTasks, totalTasks, chapters: chapters.length };
  };

  // ── markMedia ─────────────────────────────────────────────────────────────

  const markMedia = async (item: Item) => {
    const btn = document.getElementById(`mbtn-${item.itemid}`) as HTMLButtonElement;
    if (btn) { btn.innerHTML = '⏳...'; btn.disabled = true; }

    const subjects    = JSON.parse(localStorage.getItem('subjects') || '[]');
    const subjectData = subjects.find((sub: any) => sub.course_id == courseId);
    const openid      = subjectData?.open_id;
    const studentId   = localStorage.getItem('id_code');
    const tok         = localStorage.getItem('token') ?? '';

    try {
      const lessons = await fetch(`/api/lessons?itemid=${item.itemid}&recid=${recid}&token=${encodeURIComponent(tok)}`).then(r => r.json());

      if (!Array.isArray(lessons) || lessons.length === 0) {
        showToast('โหลด lessons ไม่สำเร็จ', 'red');
        resetMediaBtn(btn, item);
        return;
      }

      let lastResult = null;
      for (const lesson of lessons) {
        const isPDF = lesson.lesson_type === 'F';
        const isVDO = lesson.lesson_type === 'Y';
        const duration = isVDO ? (lesson.lenght_vdo || lesson.duration || 60) : (Math.floor(Math.random() * 46) + 45);
        const waitSec  = isPDF ? Math.floor(Math.random() * 5) + 5 : 2;

        if (btn) {
          for (let s = waitSec; s > 0; s--) {
            btn.innerHTML = isPDF ? `📄 ${s}s...` : `🎬 ${s}s...`;
            await sleep(1000);
          }
          btn.innerHTML = '⏳ ส่ง...';
        } else {
          await sleep(waitSec * 1000);
        }

        const res = await fetch('/api/progress', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tok,
            recid: Number(recid), openid, student_id: studentId,
            itemid: lesson.itemid, lessonid: lesson.lessonid,
            lesson_type: lesson.lesson_type, item_type: 'M',
            courseid: Number(courseId), full_time: duration, view_time: duration, percent: 100,
          }),
        }).then(r => r.json());
        lastResult = res;
      }

      const isComplete = lastResult?.complete === 'Y' || lastResult?.item_complete === 'Y';

      setChapters(prev => prev.map(ch => ({
        ...ch,
        child: (ch.child || []).map(i => i.itemid === item.itemid ? { ...i, view_success: 'Y' } : i),
      })));

      if (isComplete) {
        showToast(`✓ Mark ครบ ${lessons.length} lesson แล้ว!`, 'emerald');
        if (btn) btn.outerHTML = `<div class="flex items-center gap-1.5" id="mwrap-${item.itemid}"><span class="text-xs font-semibold text-emerald-600 flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>ครบแล้ว</span></div>`;
      } else {
        showToast(`ส่งแล้ว ${lessons.length} lessons`, 'emerald');
        resetMediaBtn(btn, item);
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'red');
      resetMediaBtn(btn, item);
    }
  };

  const resetMediaBtn = (btn: HTMLButtonElement | null, item: Item) => {
    if (!btn) return;
    const isVDO = item?.lesson_type === 'Y';
    btn.innerHTML = isVDO
      ? `<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Mark`
      : `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Mark`;
    btn.disabled = false;
  };

  // ── doQuiz ────────────────────────────────────────────────────────────────

  const doQuiz = async (item: Item) => {
    const btn = document.getElementById(`qbtn-${item.itemid}`) as HTMLButtonElement;
    if (btn) { btn.innerHTML = '⏳...'; btn.disabled = true; }

    const subjects    = JSON.parse(localStorage.getItem('subjects') || '[]');
    const subjectData = subjects.find((sub: any) => sub.course_id == courseId);
    const openid      = subjectData?.open_id;
    const studentId   = localStorage.getItem('id_code');
    const tok         = localStorage.getItem('token') ?? '';

    try {
      const result = await fetch('/api/quiz/answer', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token:      tok,
          itemid:     item.itemid,
          recid,
          openid,
          course_id:  courseId,
          student_id: studentId,
        }),
      }).then(r => r.json());

      if (result.skipped) {
        console.warn('[quiz] skipped for item', item.itemid);
        resetQuizBtn(btn);
        return;
      }

      const score    = result.score ?? result.total_score ?? '?';
      const maxScore = result.full_score ?? result.max_score ?? item.item_score;
      const isFull   = Number(score) >= Number(maxScore) && Number(maxScore) > 0;

      const scoreBadgeEl = document.getElementById(`qscore-${item.itemid}`);
      if (scoreBadgeEl) {
        scoreBadgeEl.textContent = `${score}/${maxScore}`;
        scoreBadgeEl.className = isFull
          ? 'text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'text-xs font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200';
      }

      fetch('/api/progress', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tok,
          recid: Number(recid), openid, student_id: studentId,
          itemid: item.itemid, lessonid: '',
          lesson_type: item.lesson_type || 'Post', item_type: 'Q',
          courseid: Number(courseId), full_time: 0, view_time: 19, percent: 100,
        }),
      });

      if (isFull) {
        showToast(`✓ เต็ม ${score}/${maxScore} คะแนน!`, 'emerald');
        if (btn) { btn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> ส่งอีกรอบ`; btn.disabled = false; }
      } else {
        showToast(`ส่งแล้ว ได้ ${score}/${maxScore} คะแนน`, 'emerald');
        resetQuizBtn(btn);
      }

      setChapters(prev => prev.map(ch => ({
        ...ch,
        child: (ch.child || []).map(i => i.itemid === item.itemid ? { ...i, view_success: 'Y' } : i),
      })));
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'red');
      resetQuizBtn(btn);
    }
  };

  const resetQuizBtn = (btn: HTMLButtonElement | null) => {
    if (!btn) return;
    btn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> ส่งคำตอบ`;
    btn.disabled = false;
  };

  // ── runSingleItem (for paid items button) ─────────────────────────────────

  const runSingleItem = async (item: Item) => {
    const studentId = localStorage.getItem('id_code');
    if (item.item_type === 'M') {
      await markMedia(item);
    } else if (item.item_type === 'Q') {
      await doQuiz(item);
      await sleep(2000);
    }
    await fetch('/api/mark-ran', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, course_id: parseInt(courseId), item_ids: [item.itemid] }),
    });
    setPaidItems(prev => { const next = new Set(prev); next.delete(String(item.itemid)); return next; });
  };

  // ── doAll ─────────────────────────────────────────────────────────────────

  const doAll = async (selectedIds?: (string | number)[] | null, chaptersData?: Chapter[]): Promise<number> => {
    if (allRunning) return 0;
    setAllRunning(true);

    const subjects    = JSON.parse(localStorage.getItem('subjects') || '[]');
    const subjectData = subjects.find((sub: any) => sub.course_id == courseId);
    const openid      = subjectData?.open_id;
    const studentId   = localStorage.getItem('id_code');
    const tok         = localStorage.getItem('token') ?? '';

    const src = chaptersData ?? chapters;
    const allItems: Item[] = [];
    src.forEach(ch => (ch.child || []).forEach(item => allItems.push(item)));

    const idSet = selectedIds ? new Set(selectedIds.map(String)) : null;
    const mediaItems = allItems.filter(i => i.item_type === 'M' && (!idSet || idSet.has(String(i.itemid))) && !isItemDone(i));
    const quizzes    = allItems.filter(i => i.item_type === 'Q' && (!idSet || idSet.has(String(i.itemid))) && !isItemDone(i));
    const total      = mediaItems.length + quizzes.length;
    let done = 0;

    if (total === 0) {
      setAutoStatus('✓ ทำครบหมดแล้ว');
      setAllRunning(false);
      return 0;
    }

    for (const item of mediaItems) {
      const emoji = item.lesson_type === 'Y' ? '🎬' : '📄';
      setAutoStatus(`${emoji} ${item.title}`);
      try {
        const lessons = await fetch(`/api/lessons?itemid=${item.itemid}&recid=${recid}&token=${encodeURIComponent(tok)}`).then(r => r.json());

        if (Array.isArray(lessons) && lessons.length > 0) {
          for (const lesson of lessons) {
            const isPDF     = lesson.lesson_type === 'F';
            const isVDO     = lesson.lesson_type === 'Y';
            const duration  = isVDO ? (lesson.lenght_vdo || lesson.duration || 60) : (Math.floor(Math.random() * 46) + 45);
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
            }).then(r => r.json());
            await sleep(300);
          }
        } else {
          // fallback: no lessons, send item directly
          const fallbackDur = Math.floor(Math.random() * 46) + 45;
          await sleep(1000);
          await fetch('/api/progress', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: tok,
              recid: Number(recid), openid, student_id: studentId,
              itemid: item.itemid, lessonid: item.lessonid || item.itemid,
              lesson_type: item.lesson_type, item_type: 'M',
              courseid: Number(courseId), full_time: fallbackDur, view_time: fallbackDur, percent: 100,
            }),
          }).then(r => r.json());
        }

        setChapters(prev => prev.map(ch => ({
          ...ch,
          child: (ch.child || []).map(i => i.itemid === item.itemid ? { ...i, view_success: 'Y' } : i),
        })));
      } catch (e) {}
      done++;
      setAutoProgress({ done, total });
      await sleep(300);
    }

    for (const item of quizzes) {
      setAutoStatus(`📝 Quiz: ${item.title}`);
      try { await doQuiz(item); } catch (e) {}
      done++;
      setAutoProgress({ done, total });
      await sleep(400);
    }

    setAutoStatus('✓ เสร็จหมดแล้ว! รีเฟรชเพื่อดูคะแนนล่าสุด');
    setAllRunning(false);
    showToast('✓ Auto เสร็จทุกอย่างแล้ว!', 'emerald');
    return done;
  };

  // ── Payment ───────────────────────────────────────────────────────────────

  const getSelectedItemIds = (): (string | number)[] => {
    const checkboxes = document.querySelectorAll('.task-checkbox:checked') as NodeListOf<HTMLInputElement>;
    return Array.from(checkboxes).map(cb => (cb.dataset.itemid ? parseInt(cb.dataset.itemid) : ''));
  };

  const selectAll = (checked: boolean) => {
    // Expand all chapters first so every checkbox is in the DOM
    setOpenChapters(Object.fromEntries(chapters.map((_, i) => [i, true])));
    // useEffect on openChapters will apply cb.checked = checked after re-render
    pendingSelectAll.current = checked;
  };

  const showPayModalFn = () => {
    const selected = getSelectedItemIds();
    if (selected.length === 0) { showToast('เลือก task ก่อนอย่างน้อย 1 อย่าง', 'red'); return; }
    setSelectedItems(selected);
    setShowPayModal(true);
  };

  const confirmPay = async () => {
    const studentId = localStorage.getItem('id_code');
    try {
      const res = await fetch('/api/spend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id:           studentId,
          task_count:           selectedItems.length,
          course_id:            parseInt(courseId),
          item_ids:             selectedItems,
          ...(resellerId ? { reseller_student_id: resellerId } : {}),
        }),
      }).then(r => r.json());

      if (!res.success) {
        showToast(
          res.error === 'insufficient_credit'
            ? `เครดิตไม่พอ — ต้องการ ${res.required} บาท มีแค่ ${res.balance} บาท`
            : res.error ?? 'เกิดข้อผิดพลาด',
          'red'
        );
        return;
      }

      setCredit(res.new_balance);
      setPaidItems(new Set(Array.from(paidItems).concat(res.paid_items.map(String))));
      setShowPayModal(false);
      showToast(`✓ หัก ${res.charged} บาท · เครดิตเหลือ ${res.new_balance.toFixed(2)} บาท`, 'emerald');

      const processedCount = await doAll(selectedItems);

      if (processedCount === 0) {
        // All items were already done — refund the charge
        const refRes = await fetch('/api/refund', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, course_id: parseInt(courseId), item_ids: selectedItems }),
        }).then(r => r.json()).catch(() => null);
        if (refRes?.success && refRes.refund_amount > 0) {
          setCredit(refRes.new_balance);
          showToast(`↩ คืนเงิน ${refRes.refund_amount.toFixed(2)} บาท (tasks เสร็จแล้ว)`, 'emerald');
        }
      } else {
        await fetch('/api/mark-ran', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, course_id: parseInt(courseId), item_ids: selectedItems }),
        });
      }
      setPaidItems(prev => {
        const next = new Set(prev);
        selectedItems.forEach(id => next.delete(String(id)));
        return next;
      });
    } catch (e: any) {
      showToast('เชื่อมต่อ server ไม่ได้: ' + e.message, 'red');
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const getItemActionHTML = (item: Item) => {
    if (item.view_success === 'Y') {
      return (
        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          เสร็จแล้ว
        </span>
      );
    }
    if (paidItems.has(String(item.itemid))) {
      return (
        <button
          onClick={() => runSingleItem(item)}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition-all flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          ส่งงาน
        </button>
      );
    }
    return (
      <input
        type="checkbox"
        className="task-checkbox w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
        data-itemid={item.itemid}
        data-type={item.item_type}
      />
    );
  };

  const renderItem = (item: Item) => {
    const isLocked  = item.can_view === 'N';
    const isVideo   = item.lesson_type === 'Y';
    const isPDF     = item.lesson_type === 'F';
    const videoDone = isVideo && item.view_success === 'Y';

    let icon = '';
    if (item.lesson_type === 'Pre' || item.lesson_type === 'Post') {
      icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`;
    } else if (isVideo) {
      icon = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    } else if (isPDF) {
      icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
    } else {
      icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`;
    }

    let typeBadge = '';
    if (item.lesson_type === 'Pre')  typeBadge = `<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">ก่อนเรียน</span>`;
    if (item.lesson_type === 'Post') typeBadge = `<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">หลังเรียน</span>`;

    let scoreBadge = '';
    if (item.item_type === 'Q') {
      const passed = item.view_success === 'Y';
      const color  = passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200';
      scoreBadge = `<span class="text-xs font-semibold px-2 py-0.5 rounded-full border ${color}" id="qscore-${item.itemid}">${item.stu_score}/${item.item_score}</span>`;
    }

    return (
      <li key={item.itemid} className={`px-5 py-3 flex items-center justify-between gap-3 ${isLocked ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={`mt-0.5 flex-shrink-0 ${videoDone ? 'text-emerald-500' : isVideo ? 'text-indigo-500' : isPDF ? 'text-orange-500' : 'text-slate-400'}`}
            dangerouslySetInnerHTML={{ __html: icon }}
          />
          <div className="min-w-0">
            <p className="text-sm text-slate-700 leading-snug">{item.title}</p>
            {typeBadge && <div className="mt-1" dangerouslySetInnerHTML={{ __html: typeBadge }} />}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" id={`item-action-${item.itemid}`}>
          {scoreBadge && <span dangerouslySetInnerHTML={{ __html: scoreBadge }} />}
          {getItemActionHTML(item)}
        </div>
      </li>
    );
  };

  if (!token) return null;

  const summary = getSummary();

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Running banner — fixed above everything */}
      {allRunning && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
            <span>กำลังทำงานอยู่ — อย่าปิดหรือรีเฟรชหน้านี้</span>
          </div>
          <span className="opacity-75 text-xs truncate max-w-[40%]">{autoStatus}</span>
        </div>
      )}
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/courses" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              กลับ
            </a>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-bold text-slate-800 text-sm truncate max-w-[180px] sm:max-w-xs">{name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">ID: {courseId}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl min-w-[60px] text-center">
              ฿{credit.toFixed(2)}
            </span>
            <a href="/topup" className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              เติมเงิน
            </a>
          </div>
        </div>
      </nav>

      {/* Reseller mode banner — normal flow, below navbar */}
      {resellerId && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
          โหมดตัวแทน — ทำงานให้ลูกค้า: <strong>{localStorage.getItem('id_code')}</strong> · เรียกเก็บจาก: <strong>{resellerId}</strong>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6 fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 text-center card-hover">
            <div className="text-base sm:text-xl font-bold text-slate-800">{summary.totalScore}/{summary.maxScore}</div>
            <div className="text-xs text-slate-400 mt-0.5">คะแนนรวม</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 text-center card-hover">
            <div className="text-base sm:text-xl font-bold text-slate-800">{summary.doneTasks}/{summary.totalTasks}</div>
            <div className="text-xs text-slate-400 mt-0.5">ผ่านแล้ว</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 text-center card-hover">
            <div className="text-base sm:text-xl font-bold text-slate-800">{summary.chapters}</div>
            <div className="text-xs text-slate-400 mt-0.5">บทเรียน</div>
          </div>
        </div>

        {/* Auto button */}
        <div className="mb-4 fade-in" style={{ animationDelay: '150ms' }}>
          <div className="flex gap-2 mb-2">
            <button onClick={() => selectAll(true)} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition">เลือกทั้งหมด</button>
            <button onClick={() => selectAll(false)} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition">ยกเลิกทั้งหมด</button>
          </div>
          <button
            onClick={showPayModalFn}
            disabled={allRunning}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.99] disabled:opacity-75 text-white font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {allRunning ? `กำลังทำ... ${autoProgress.done}/${autoProgress.total}` : 'Auto ที่เลือก'}
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">{autoStatus}</p>
        </div>

        {/* Pay modal */}
        {showPayModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 fade-in">
              <h3 className="font-bold text-slate-800 text-lg mb-1">ยืนยันการชำระเงิน</h3>
              <p className="text-sm text-slate-500 mb-4">ระบบจะหักเครดิตและทำ Auto ให้อัตโนมัติ</p>
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">จำนวน task ที่เลือก</span>
                  <span className="font-semibold text-slate-800">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">ราคาต่อ task</span>
                  <span className="font-semibold text-slate-800">{pricePerTask} บาท</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-700">รวม</span>
                  <span className="text-indigo-600">{(selectedItems.length * pricePerTask).toFixed(2)} บาท</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">เครดิตคงเหลือหลังหัก</span>
                  <span className={credit - selectedItems.length * pricePerTask >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-500'}>
                    {(credit - selectedItems.length * pricePerTask).toFixed(2)} บาท
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPayModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition">ยกเลิก</button>
                <button onClick={confirmPay} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition">ชำระ & Auto</button>
              </div>
              <a href="/topup" className="block text-center text-xs text-indigo-500 hover:underline mt-3">เติมเครดิต →</a>
            </div>
          </div>
        )}

        {/* Chapter list */}
        <div id="chapter-list">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
              <svg className="w-5 h-5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
              <span className="text-sm">กำลังโหลด...</span>
            </div>
          ) : (
            chapters.map((chapter, i) => {
              if (!chapter.child) return null;
              const progress = getProgress(chapter.child);
              const allDone  = progress === 100;
              const noQuiz   = progress === null;
              const barColor = allDone ? 'bg-emerald-500' : 'bg-indigo-400';

              return (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border ${allDone ? 'border-emerald-200' : 'border-slate-100'} overflow-hidden card-hover mb-3 fade-in`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="px-5 py-4 flex items-center justify-between cursor-pointer select-none" onClick={() => toggleChapter(i)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${allDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {allDone ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (i + 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm leading-snug">{chapter.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {noQuiz ? `${chapter.child.length} งาน` : `${progress}% เสร็จแล้ว · ${chapter.child.length} งาน`}
                        </p>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform duration-300 ${openChapters[i] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {!noQuiz && (
                    <div className="h-0.5 bg-slate-100 mx-5">
                      <div className={`${barColor} h-full chapter-bar rounded-full`} style={{ width: `${progress}%` }} />
                    </div>
                  )}

                  {openChapters[i] && (
                    <div className="collapse-content" style={{ maxHeight: 'none' }}>
                      <ul className="divide-y divide-slate-50 mt-1 pb-1">
                        {(chapter.child || []).map(item => renderItem(item))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        * { font-family: 'IBM Plex Sans Thai', sans-serif; }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .chapter-bar { transition: width 0.4s cubic-bezier(0.4,0,0.2,1); }
        .collapse-content { overflow: hidden; transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>
    </div>
  );
}

export default function WorkPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkContent />
    </Suspense>
  );
}
