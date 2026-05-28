'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import CreditBadge from './CreditBadge';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const links = [
    { href: '/courses', label: 'วิชาของฉัน' },
    { href: '/topup', label: 'เติมเงิน' },
  ];

  return (
    <nav className="bg-brand-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/courses" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-xl">🫐</span>
          <span>Blueberry</span>
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <CreditBadge />

        <button
          onClick={handleLogout}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>
    </nav>
  );
}
