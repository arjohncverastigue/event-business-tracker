import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="relative flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden rounded-br-[120px] border border-white/10 bg-gradient-to-br from-[#083358] via-[#062034] to-[#01060b] p-12 lg:flex">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        <div className="relative space-y-6">
          <Link href="/" className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">
            Event Business Tracker
          </Link>
          <h2 className="text-4xl font-semibold text-white">
            Plan with confidence.
          </h2>
          <p className="max-w-md text-base text-[var(--muted)]">
            See bookings, finances, and proposals in the same workspace. Secure authentication keeps
            every client conversation protected.
          </p>
        </div>
        <div className="relative space-y-3 text-sm text-[var(--muted)]">
          <p className="text-xs uppercase tracking-[0.5em] text-white/60">Roadmap</p>
          <ul className="space-y-2">
            <li>Day 1 · Auth & Models</li>
            <li>Day 2 · Bookings + Finances</li>
            <li>Day 3 · Quotations + AI</li>
            <li>Day 4 · Exports + Email</li>
            <li>Day 5 · Dashboard polish</li>
          </ul>
        </div>
      </div>
      <div className="flex w-full flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>
      </div>
    </section>
  );
}
