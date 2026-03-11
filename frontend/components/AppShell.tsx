'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import { Sidebar } from '@/components/Sidebar';

const SIDEBAR_PREFIXES = ['/dashboard', '/bookings', '/finances', '/quotations'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = SIDEBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    setIsSidebarOpen(true);
  }, [pathname, showSidebar]);

  return (
    <div className="flex min-h-screen">
      {showSidebar && isSidebarOpen && <Sidebar onClose={() => setIsSidebarOpen(false)} />}
      <main className="relative flex-1 px-4 py-4 lg:px-12 lg:py-10">{children}</main>
      {showSidebar && !isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
          className="fixed left-4 top-4 z-50 rounded-full border border-white/20 bg-black/70 p-3 text-white/80 shadow-2xl backdrop-blur"
        >
          <Menu size={18} />
        </button>
      )}
    </div>
  );
}
