'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Transaction {
  type: 'topup' | 'spend';
  status: 'completed' | 'pending' | 'rejected';
  amount: number;
  created_at: string;
  description?: string;
}

export default function TopupPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [bankInfo, setBankInfo] = useState({ bank_name: '', account_no: '', account_name: '', qr_image: '' });
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [slipStatus, setSlipStatus] = useState<{ type?: string; message?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const id = localStorage.getItem('id_code');
    if (!t || !id) {
      router.push('/login');
      return;
    }
    setToken(t);
    setStudentId(id);

    loadPaymentInfo();
    loadCredit(id);
  }, [router]);

  const loadPaymentInfo = async () => {
    try {
      const res = await fetch('/api/payment-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).then(r => r.json());

      setBankInfo({
        bank_name: res.bank_name || '—',
        account_no: res.account_no || '—',
        account_name: res.account_name || '—',
        qr_image: res.qr_image || '',
      });
    } catch (e) {
      console.warn('loadPaymentInfo error:', e);
    }
  };

  const loadCredit = async (id: string) => {
    try {
      const res = await fetch('/api/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id }),
      }).then(r => r.json());

      const bal = (res.balance ?? 0).toFixed(2);
      setBalance(Number(bal));
      setHistory(res.history ?? []);
    } catch (e) {
      setBalance(0);
      console.warn('loadCredit error:', e);
    } finally {
      setLoading(false);
    }
  };

  const copyAccount = () => {
    const acct = bankInfo.account_no;
    navigator.clipboard.writeText(acct.replace(/-/g, '')).then(() => {
      setSlipStatus({ type: 'approved', message: `คัดลอกเลขบัญชีแล้ว: ${acct}` });
      setTimeout(() => setSlipStatus(null), 2000);
    });
  };

  const previewSlip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlip(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSlipPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitSlip = async () => {
    if (!slip) {
      setSlipStatus({ type: 'error', message: 'กรุณาเลือกรูปสลิปก่อน' });
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('student_id', studentId || '');
    formData.append('slip', slip);

    try {
      const res = await fetch('/api/topup', { method: 'POST', body: formData }).then(r => r.json());

      if (res.success || res.status === 'approved') {
        setSlipStatus({ type: 'approved', message: res.message });
        if (studentId) loadCredit(studentId);
        setSlip(null);
        setSlipPreview(null);
      } else if (res.status === 'pending') {
        setSlipStatus({ type: 'pending', message: res.message });
      } else {
        setSlipStatus({ type: 'rejected', message: res.message ?? 'เกิดข้อผิดพลาด' });
      }
    } catch (e) {
      setSlipStatus({ type: 'error', message: 'เชื่อมต่อ server ไม่ได้' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderHistory = (txs: Transaction[]) => {
    if (txs.length === 0) {
      return <p className="text-sm text-slate-400 text-center py-6">ยังไม่มีประวัติ</p>;
    }

    return (
      <div>
        {txs.map((tx, i) => {
          const isTopup = tx.type === 'topup';
          const amtColor = isTopup ? 'text-emerald-600' : 'text-slate-700';
          const sign = isTopup ? '+' : '-';
          const typeLabel = isTopup ? 'เติมเครดิต' : 'ใช้งาน';
          const typeCls = isTopup ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500';
          const stColor = tx.status === 'completed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-red-400';
          const stLabel = tx.status === 'completed' ? 'สำเร็จ' : tx.status === 'pending' ? 'รอดำเนินการ' : 'ถูกปฏิเสธ';
          const date = new Date(tx.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

          return (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${typeCls}`}>{typeLabel}</span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-600 font-medium truncate">{tx.description || '—'}</p>
                  <p className="text-xs text-slate-400">
                    {date} · <span className={stColor}>{stLabel}</span>
                  </p>
                </div>
              </div>
              <span className={`font-bold text-sm flex-shrink-0 ml-2 ${amtColor}`}>
                {sign}{Number(tx.amount).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!token) return null;

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/courses" className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              กลับ
            </a>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="font-bold text-slate-800 text-sm">เติมเครดิต</span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl min-w-[60px] text-center" id="nav-credit">
            ฿{balance.toFixed(2)}
          </span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Balance card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white fade-in">
          <p className="text-sm opacity-75 mb-1">เครดิตคงเหลือ</p>
          <p className="text-4xl font-bold" id="balance-main">
            ฿{balance.toFixed(2)}
          </p>
          <p className="text-xs opacity-50 mt-1" id="student-id-label">
            รหัส: {studentId}
          </p>
        </div>

        {/* Card ข้อมูลการโอน */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 fade-in" style={{ animationDelay: '80ms' }}>
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            โอนเงินมาที่
          </h2>

          <div className="flex gap-4 items-start">
            {/* QR Code */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                {bankInfo.qr_image ? (
                  <img src={bankInfo.qr_image} alt="QR PromptPay" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="text-center p-2">
                    <svg className="w-8 h-8 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    <p className="text-xs text-slate-300 mt-1">QR Code</p>
                  </div>
                )}
              </div>
            </div>

            {/* ข้อมูลบัญชี */}
            <div className="flex-1 space-y-2.5">
              <div>
                <p className="text-xs text-slate-400">ธนาคาร</p>
                <p className="text-sm font-semibold text-slate-800" id="info-bank">
                  {bankInfo.bank_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">เลขบัญชี</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800 tracking-wider" id="info-account">
                    {bankInfo.account_no}
                  </p>
                  <button onClick={copyAccount} className="text-xs text-indigo-500 hover:text-indigo-700 transition" title="คัดลอก">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">ชื่อบัญชี</p>
                <p className="text-sm font-semibold text-slate-800" id="info-name">
                  {bankInfo.account_name}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">โอนเงินแล้วอัพโหลดสลิปด้านล่าง — ระบบจะเติมเครดิตให้อัตโนมัติ</p>
        </div>

        {/* Upload form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 fade-in" style={{ animationDelay: '160ms' }}>
          <h2 className="font-bold text-slate-800 mb-4">อัพโหลดสลิปโอนเงิน</h2>

          <label htmlFor="slip-file" className="block mb-4 cursor-pointer">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition">
              {slipPreview ? (
                <div className="mb-3">
                  <img src={slipPreview} alt="preview" className="max-h-52 mx-auto rounded-xl object-contain" />
                </div>
              ) : (
                <div>
                  <svg className="w-9 h-9 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-slate-500 font-medium">แตะเพื่อเลือกรูปสลิป</p>
                  <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP ขนาดไม่เกิน 5MB</p>
                </div>
              )}
            </div>
          </label>
          <input id="slip-file" type="file" accept=".jpg,.jpeg,.png,.jfif,.webp" className="hidden" onChange={previewSlip} />

          {slipStatus && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium mb-4 ${
                slipStatus.type === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : slipStatus.type === 'pending'
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {slipStatus.message}
            </div>
          )}

          <button
            onClick={submitSlip}
            disabled={submitting || !slip}
            id="submit-btn"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span id="submit-btn-text">{submitting ? 'กำลังตรวจสลิป...' : 'ส่งสลิป'}</span>
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">ระบบจะอ่านยอดเงินจากสลิปอัตโนมัติ</p>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 fade-in" style={{ animationDelay: '240ms' }}>
          <h2 className="font-bold text-slate-800 mb-4">ประวัติล่าสุด</h2>
          <div id="history-list">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <svg className="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                <span className="text-sm">กำลังโหลด...</span>
              </div>
            ) : (
              renderHistory(history)
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        * {
          font-family: 'IBM Plex Sans Thai', sans-serif;
        }
        .fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }
      `}</style>
    </div>
  );
}
