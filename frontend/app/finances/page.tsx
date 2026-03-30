'use client';

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Trash2 } from "lucide-react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import api from "@/lib/api";
import { downloadFile } from "@/lib/download";
import type { Finance } from "@/types";

const financeDefaults = {
  entry_type: "income" as "income" | "expense",
  description: "",
  category: "",
  amount: "",
  entry_date: new Date().toISOString().slice(0, 10),
};

type FinanceFormState = typeof financeDefaults;

const fetchFinances = async (): Promise<Finance[]> => {
  const { data } = await api.get("/finances");
  return data;
};

export default function FinancesPage() {
  const token = useRequireAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FinanceFormState>(financeDefaults);

  const financesQuery = useQuery({
    queryKey: ["finances"],
    queryFn: fetchFinances,
    enabled: Boolean(token),
  });

  const createFinance = useMutation({
    mutationFn: async (payload: FinanceFormState) => {
      const response = await api.post("/finances", {
        ...payload,
        amount: Number(payload.amount),
        entry_date: new Date(payload.entry_date).toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finances"] });
      setForm(financeDefaults);
    },
  });

  const deleteFinance = useMutation({
    mutationFn: async (financeId: number) => api.delete(`/finances/${financeId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finances"] }),
  });

  const handlePdfExport = () =>
    downloadFile("/exports/pdf/finances", "finances.pdf", "application/pdf");
  const handleExcelExport = () =>
    downloadFile(
      "/exports/excel/finances",
      "finances.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

  const { income, expense, net } = useMemo(() => {
    const base = { income: 0, expense: 0, net: 0 };
    if (!financesQuery.data) return base;
    for (const record of financesQuery.data) {
      if (record.entry_type === "income") {
        base.income += Number(record.amount);
      } else {
        base.expense += Number(record.amount);
      }
    }
    base.net = base.income - base.expense;
    return base;
  }, [financesQuery.data]);

  if (!token) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">Finances</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white">Cash Flow Console</h1>
              <p className="text-sm text-[var(--muted)]">
                Capture every invoice, payout, and vendor cost to see net profit in seconds.
              </p>
            </div>
            <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-[var(--muted)] md:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em]">Income</p>
                <p className="text-2xl font-semibold text-white">${income.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em]">Expenses</p>
                <p className="text-2xl font-semibold text-white">${expense.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em]">Net</p>
                <p className={`text-2xl font-semibold ${net >= 0 ? "text-[#7ff0d3]" : "text-red-300"}`}>
                  ${net.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              onClick={handlePdfExport}
              className="rounded-full border border-white/15 px-4 py-2 text-white/80 hover:text-white"
            >
              Download PDF Report
            </button>
            <button
              type="button"
              onClick={handleExcelExport}
              className="rounded-full border border-white/15 px-4 py-2 text-white/80 hover:text-white"
            >
              Download Excel
            </button>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              createFinance.mutate(form);
            }}
          >
            <div className="flex items-center gap-3 text-white">
              <div className="rounded-2xl bg-white/10 p-3">
                {form.entry_type === "income" ? (
                  <ArrowDownCircle size={22} />
                ) : (
                  <ArrowUpCircle size={22} />
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">Log entry</p>
                <p className="text-lg font-semibold">
                  {form.entry_type === "income" ? "Incoming payment" : "Outgoing cost"}
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">Type</span>
                <div className="grid grid-cols-2 gap-2">
                  {["income", "expense"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, entry_type: type as "income" | "expense" }))
                      }
                      className={`rounded-2xl border px-4 py-2 text-sm ${
                        form.entry_type === type
                          ? "border-[var(--accent)] text-white"
                          : "border-white/15 text-white/60"
                      }`}
                    >
                      {type === "income" ? "Income" : "Expense"}
                    </button>
                  ))}
                </div>
              </label>
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">Description</span>
                <input
                  type="text"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Invoice for Plume Soiree"
                  required
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">Category</span>
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Design, Venue, Catering..."
                  required
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">Amount</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                    required
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">Date</span>
                  <input
                    type="date"
                    value={form.entry_date}
                    onChange={(event) => setForm((prev) => ({ ...prev, entry_date: event.target.value }))}
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                    required
                  />
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={createFinance.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7ff0d3] to-[#00c896] px-5 py-3 font-semibold uppercase tracking-wide text-[#041417]"
            >
              {createFinance.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Record entry"
              )}
            </button>
            {createFinance.isError && (
              <p className="text-sm text-red-300">Unable to record entry. Try again.</p>
            )}
          </form>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <p className="text-xs uppercase tracking-[0.4em]">Recent activity</p>
              {financesQuery.isFetching && <Loader2 size={16} className="animate-spin" />}
            </div>
            <div className="space-y-3">
              {financesQuery.data && financesQuery.data.length === 0 && (
                <p className="text-sm text-[var(--muted)]">No finance entries yet.</p>
              )}
              {financesQuery.data?.map((record) => (
                <article
                  key={record.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div>
                    <p className="text-base font-semibold text-white">{record.description}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {record.category} ·
                      {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                        new Date(record.entry_date)
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p
                      className={`text-lg font-semibold ${
                        record.entry_type === "income" ? "text-[#7ff0d3]" : "text-red-300"
                      }`}
                    >
                      {record.entry_type === "income" ? "+" : "-"}${Number(record.amount).toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteFinance.mutate(record.id)}
                      className="rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                      title="Remove entry"
                    >
                      {deleteFinance.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
