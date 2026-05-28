'use client';

import { useEffect, useState } from 'react';

export default function CreditBadge({ refresh }: { refresh?: number }) {
  const [credit, setCredit] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/credit')
      .then(r => r.json())
      .then(d => setCredit(d.credit ?? 0))
      .catch(() => setCredit(0));
  }, [refresh]);

  if (credit === null) {
    return <span className="text-xs text-white/50">กำลังโหลด...</span>;
  }

  return (
    <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-sm font-medium">
      <span className="text-yellow-300">💎</span>
      <span>{credit.toFixed(2)}</span>
    </span>
  );
}
