'use client';

import Link from 'next/link';

interface Props {
  onClose: () => void;
  credit: number;
  required: number;
}

export default function PayModal({ onClose, credit, required }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">💎</div>
          <h2 className="text-lg font-bold text-slate-800">เครดิตไม่พอ</h2>
          <p className="text-sm text-slate-500 mt-1">
            คุณมี{' '}
            <span className="font-semibold text-red-500">{credit.toFixed(2)}</span>
            {' '}เครดิต แต่ต้องการอย่างน้อย{' '}
            <span className="font-semibold text-slate-700">{required.toFixed(2)}</span>
            {' '}เครดิต
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/topup"
            className="w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            เติมเงินเดี๋ยวนี้
          </Link>
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
