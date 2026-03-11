'use client';

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Calendar, FileText, WalletCards, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import api from "@/lib/api";
import type { Booking, Finance, Quotation } from "@/types";

export default function DashboardPage() {
  const token = useRequireAuth();
  const shouldFetch = Boolean(token);

  const bookingsQuery = useQuery({
    queryKey: ["dashboard-bookings"],
    queryFn: async (): Promise<Booking[]> => {
      const { data } = await api.get("/bookings");
      return data;
    },
    enabled: shouldFetch,
  });

  const financesQuery = useQuery({
    queryKey: ["dashboard-finances"],
    queryFn: async (): Promise<Finance[]> => {
      const { data } = await api.get("/finances");
      return data;
    },
    enabled: shouldFetch,
  });

  const quotationsQuery = useQuery({
    queryKey: ["dashboard-quotations"],
    queryFn: async (): Promise<Quotation[]> => {
      const { data } = await api.get("/quotations");
      return data;
    },
    enabled: shouldFetch,
  });

  const bookingsTrend = useMemo(() => {
    if (!bookingsQuery.data) return [];
    const map = new Map<string, number>();
    bookingsQuery.data.forEach((booking) => {
      const date = new Date(booking.event_date);
      const label = date.toLocaleString(undefined, { month: "short", year: "numeric" });
      map.set(label, (map.get(label) ?? 0) + Number(booking.amount || 0));
    });
    return Array.from(map.entries()).map(([label, value]) => ({ month: label, value }));
  }, [bookingsQuery.data]);

  const financeBars = useMemo(() => {
    if (!financesQuery.data) return { income: 0, expense: 0 };
    return financesQuery.data.reduce(
      (acc, entry) => {
        if (entry.entry_type === "income") acc.income += Number(entry.amount || 0);
        else acc.expense += Number(entry.amount || 0);
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [financesQuery.data]);

  const quotationStatusData = useMemo(() => {
    if (!quotationsQuery.data) return [];
    const counts = quotationsQuery.data.reduce<Record<string, number>>((acc, quotation) => {
      const status = quotation.status || "draft";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [quotationsQuery.data]);

  if (!token) {
    return null;
  }

  const highlightCards = [
    {
      title: "Bookings",
      description: "Capture engagements, venues, and values while keeping totals live.",
      icon: Calendar,
      href: "/bookings",
      actionLabel: "Open schedule",
    },
    {
      title: "Finances",
      description: "Log income vs. expenses to see instant profitability.",
      icon: WalletCards,
      href: "/finances",
      actionLabel: "Track cash flow",
    },
    {
      title: "Quotations",
      description: "Draft proposals with AI-suggested line items and live previews.",
      icon: FileText,
      href: "/quotations",
      actionLabel: "Build proposals",
    },
  ];

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">
            Authenticated area
          </p>
          <h1 className="text-4xl font-semibold text-white">Mission Control</h1>
          <p className="text-base text-[var(--muted)] max-w-3xl">
            You are authenticated via JWT. Manage bookings, finances, and AI-assisted quotations from a single
            console while exports and analytics arrive later this week.
          </p>
          <Link href="/" className="text-sm text-[var(--accent)]">
            Return to overview
          </Link>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {highlightCards.map(({ title, description, icon: Icon, href, actionLabel }) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
                <Icon size={22} />
              </div>
              <p className="mt-4 text-xl font-medium text-white">{title}</p>
              <p className="text-sm text-[var(--muted)]">{description}</p>
              <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--accent)]">
                {actionLabel} <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Bookings revenue</p>
                <h3 className="text-lg font-semibold text-white">Events by month</h3>
              </div>
              {bookingsQuery.isFetching && <Loader2 size={16} className="animate-spin text-[var(--muted)]" />}
            </div>
            {bookingsTrend.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingsTrend} margin={{ left: 0, right: 0, top: 10 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" stroke="var(--muted)" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                    <YAxis stroke="var(--muted)" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: "rgba(0,0,0,0.8)", borderRadius: 12, border: "none" }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
                    />
                    <Line type="monotone" dataKey="value" stroke="#7ff0d3" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">No booking data yet.</p>
            )}
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Finances</p>
                <h3 className="text-lg font-semibold text-white">Income vs Expenses</h3>
              </div>
              {financesQuery.isFetching && <Loader2 size={16} className="animate-spin text-[var(--muted)]" />}
            </div>
            {financesQuery.data && financesQuery.data.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[financeBars]}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey={() => "Totals"} stroke="var(--muted)" tick={{ fill: "var(--muted)" }} />
                    <YAxis stroke="var(--muted)" tick={{ fill: "var(--muted)" }} />
                    <Tooltip
                      contentStyle={{ background: "rgba(0,0,0,0.8)", borderRadius: 12, border: "none" }}
                      formatter={(value: number, name) => [`$${value.toLocaleString()}`, name]}
                    />
                    <Bar dataKey="income" fill="#7ff0d3" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expense" fill="#ff9f7f" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">No finance entries yet.</p>
            )}
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Quotation pipeline</p>
              <h3 className="text-lg font-semibold text-white">Status distribution</h3>
            </div>
            {quotationsQuery.isFetching && <Loader2 size={16} className="animate-spin text-[var(--muted)]" />}
          </div>
          {quotationStatusData.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quotationStatusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {quotationStatusData.map((_, index) => (
                      <Cell key={_.name} fill={["#7ff0d3", "#ff9f7f", "#7f8bff", "#ffd479"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "rgba(0,0,0,0.8)", borderRadius: 12, border: "none" }}
                    formatter={(value: number, name) => [`${value} quotes`, name.toString()]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No quotations yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
