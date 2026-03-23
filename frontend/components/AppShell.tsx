'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import { Sidebar } from '@/components/Sidebar';

const SIDEBAR_PREFIXES = ['/dashboard', '/bookings', '/finances', '/quotations', '/equipment', '/damage-reports'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = SIDEBAR_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen">
      {showSidebar && isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
          <Sidebar onClose={() => setIsSidebarOpen(false)} className="relative z-50" />
        </>
      )}
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
