'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Calendar, FileText, Home, LogOut, Menu, Wallet } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/finances', label: 'Finances', icon: Wallet },
  { href: '/quotations', label: 'Quotations', icon: FileText },
];

type SidebarProps = {
  onClose?: () => void;
  className?: string;
};

export function Sidebar({ onClose, className = 'hidden lg:flex lg:flex-col' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ebt_token');
    }
    router.push('/login');
  };

  return (
    <aside
      className={`w-64 shrink-0 border-r border-white/10 bg-black/40 px-6 py-8 text-sm text-white/70 backdrop-blur-xl ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">Event Business</p>
          <h1 className="text-2xl font-semibold text-white">Tracker</h1>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-2xl border border-white/15 p-2 text-white/70 transition hover:text-white"
          >
            <Menu size={18} />
          </button>
        )}
      </div>
      <nav className="mt-10 flex flex-col gap-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                active
                  ? 'bg-white/15 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 text-xs text-[var(--muted)]">
        <p>Plan smarter. Finish faster.</p>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-white/80 transition hover:text-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
