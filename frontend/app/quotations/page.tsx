'use client';

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import api from "@/lib/api";
import { downloadFile } from "@/lib/download";
import type { AiQuotationSuggestion, Quotation, QuotationItem } from "@/types";

const createEmptyItem = (): QuotationItem => ({
  description: "",
  quantity: 1,
  unit_price: 0,
});

const getDefaultForm = () => ({
  client: "",
  event_type: "",
  event_date: new Date().toISOString().slice(0, 10),
  status: "draft",
  items: [createEmptyItem()],
});

type QuotationFormState = ReturnType<typeof getDefaultForm>;

const fetchQuotations = async (): Promise<Quotation[]> => {
  const { data } = await api.get("/quotations");
  return data;
};

export default function QuotationsPage() {
  const token = useRequireAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<QuotationFormState>(() => getDefaultForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [aiBrief, setAiBrief] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTargets, setEmailTargets] = useState<Record<number, string>>({});
  const [emailStatus, setEmailStatus] = useState<Record<number, string>>({});

  const quotationsQuery = useQuery({
    queryKey: ["quotations"],
    queryFn: fetchQuotations,
    enabled: Boolean(token),
  });

  const resetForm = () => {
    setForm(getDefaultForm());
    setEditingId(null);
    setFormError(null);
  };

  const mapFormToPayload = (payload: QuotationFormState) => ({
    client: payload.client,
    event_type: payload.event_type,
    event_date: new Date(payload.event_date).toISOString(),
    status: payload.status,
    items: payload.items.map((item) => ({
      description: item.description,
      quantity: Math.max(1, Number(item.quantity) || 1),
      unit_price: Math.max(0, Number(item.unit_price) || 0),
    })),
  });

  const saveQuotation = useMutation({
    mutationFn: async (payload: QuotationFormState) => {
      const body = mapFormToPayload(payload);
      if (editingId) {
        const { data } = await api.put(`/quotations/${editingId}`, body);
        return data;
      }
      const { data } = await api.post("/quotations", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      resetForm();
    },
    onError: () => setFormError("Unable to save quotation. Double-check your fields and try again."),
  });

  const deleteQuotation = useMutation({
    mutationFn: async (quotationId: number) => api.delete(`/quotations/${quotationId}`),
    onSuccess: (_data, quotationId) => {
      if (editingId === quotationId) {
        resetForm();
      }
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });

  const aiMutation = useMutation({
    mutationFn: async (brief: string) => {
      const { data } = await api.post<AiQuotationSuggestion>("/quotations/generate-ai", { brief });
      return data;
    },
    onSuccess: (data) => {
      setForm((prev) => ({
        ...prev,
        items: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }));
    },
  });

  const handleSelectQuotation = (quotation: Quotation) => {
    setEditingId(quotation.id);
    setForm({
      client: quotation.client,
      event_type: quotation.event_type,
      event_date: quotation.event_date.slice(0, 10),
      status: quotation.status,
      items: quotation.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
    setForm((prev) => {
      const nextItems = prev.items.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "quantity" || field === "unit_price") {
          return { ...item, [field]: Number(value) };
        }
        return { ...item, [field]: value };
      });
      return { ...prev, items: nextItems };
    });
  };

  const addItemRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  };

  const removeItemRow = (index: number) => {
    setForm((prev) => {
      if (prev.items.length === 1) return prev;
      return { ...prev, items: prev.items.filter((_, idx) => idx !== index) };
    });
  };

  const sendEmailMutation = useMutation({
    mutationFn: async ({ quotationId, recipient }: { quotationId: number; recipient: string }) => {
      await api.post(`/quotations/${quotationId}/send-email`, {
        recipient,
        message: aiBrief || undefined,
      });
    },
    onSuccess: (_data, variables) => {
      setEmailTargets((prev) => ({ ...prev, [variables.quotationId]: "" }));
      setEmailStatus((prev) => ({ ...prev, [variables.quotationId]: "Email sent!" }));
    },
    onError: (_err, variables) => {
      setEmailStatus((prev) => ({ ...prev, [variables.quotationId]: "Failed to send email." }));
    },
  });

  const downloadQuotationPdf = (quotationId: number) =>
    downloadFile(`/exports/pdf/quotations/${quotationId}`, `quotation-${quotationId}.pdf`, "application/pdf");

  const formTotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
        0
      ),
    [form.items]
  );

  if (!token) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">Quotations</p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white">Proposal Architect</h1>
              <p className="text-sm text-[var(--muted)]">
                Draft, refine, and share line-item proposals with AI assisting the structure.
              </p>
            </div>
            <div className="text-sm text-[var(--muted)]">
              {editingId ? (
                <button
                  type="button"
                  className="rounded-full border border-white/15 px-4 py-2 text-white/80 hover:text-white"
                  onClick={resetForm}
                >
                  + New quotation
                </button>
              ) : (
                <span>Creating new quotation</span>
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <form
              className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
              onSubmit={(event) => {
                event.preventDefault();
                saveQuotation.mutate(form);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">
                    {editingId ? "Update quotation" : "Create quotation"}
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    {editingId ? "Editing existing quote" : "New proposal draft"}
                  </h2>
                </div>
                {saveQuotation.isPending && (
                  <Loader2 size={20} className="animate-spin text-[var(--muted)]" />
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: "Client", name: "client" as const, placeholder: "Avery Agency" },
                  { label: "Event type", name: "event_type" as const, placeholder: "Product Launch" },
                ].map((field) => (
                  <label key={field.name} className="text-sm text-[var(--muted)]">
                    <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                      {field.label}
                    </span>
                    <input
                      type="text"
                      value={form[field.name]}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                      required
                    />
                  </label>
                ))}
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">Event date</span>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(event) => setForm((prev) => ({ ...prev, event_date: event.target.value }))}
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                    required
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Line items</p>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-sm text-white/80 hover:text-white"
                  >
                    <Plus size={14} /> Add item
                  </button>
                </div>
                {form.items.map((item, index) => (
                  <div
                    key={`item-${index}`}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 md:grid-cols-[1.2fr_0.5fr_0.5fr_auto]"
                  >
                    <input
                      type="text"
                      value={item.description}
                      onChange={(event) => updateItem(index, "description", event.target.value)}
                      placeholder="Description"
                      className="rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                      required
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateItem(index, "quantity", event.target.value)}
                      className="rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                    />
                    <input
                      type="number"
                      min={0}
                      step="50"
                      value={item.unit_price}
                      onChange={(event) => updateItem(index, "unit_price", event.target.value)}
                      className="rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      className="rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                      onClick={() => removeItemRow(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {formError && <p className="text-sm text-red-300">{formError}</p>}

              <button
                type="submit"
                disabled={saveQuotation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7ff0d3] to-[#00c896] px-5 py-3 font-semibold uppercase tracking-wide text-[#041417]"
              >
                {saveQuotation.isPending ? <Loader2 size={18} className="animate-spin" /> : "Save quotation"}
              </button>
            </form>

            <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 text-white">
                <Sparkles size={20} />
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Claude assist</p>
                  <p className="text-lg font-semibold">Generate line items from a brief</p>
                </div>
              </div>
              <textarea
                value={aiBrief}
                onChange={(event) => setAiBrief(event.target.value)}
                className="h-28 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                placeholder="Describe the event, theme, and deliverables..."
              />
              <button
                type="button"
                onClick={() => aiMutation.mutate(aiBrief)}
                disabled={!aiBrief || aiMutation.isPending}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white disabled:opacity-50"
              >
                {aiMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Generate with Claude"}
              </button>
              {aiMutation.isError && (
                <p className="text-sm text-red-300">Unable to fetch AI suggestion. Please try again.</p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Preview</p>
                  <h3 className="text-xl font-semibold text-white">Proposal snapshot</h3>
                </div>
                <p className="text-sm text-[var(--muted)]">Total ${formTotal.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-[var(--muted)]">
                <p className="text-white">{form.client || "Client TBD"}</p>
                <p>{form.event_type || "Event type TBD"}</p>
                <p>Event date: {form.event_date || "—"}</p>
                <p>Status: {form.status}</p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => downloadQuotationPdf(editingId)}
                  className="w-full rounded-2xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:text-white"
                >
                  Download this quotation (PDF)
                </button>
              )}
              <div className="space-y-2 text-sm">
                {form.items.map((item, idx) => (
                  <div
                    key={`preview-${idx}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-white">{item.description || "Line item"}</p>
                      <p className="text-[var(--muted)] text-xs">
                        Qty {item.quantity || 0} · ${Number(item.unit_price || 0).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-white">
                      {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white">
                <span>Total</span>
                <strong>${formTotal.toLocaleString()}</strong>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Saved quotations</p>
                {quotationsQuery.isFetching && (
                  <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
                )}
              </div>
              <div className="space-y-3">
                {quotationsQuery.data && quotationsQuery.data.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">No quotations yet. Start drafting one.</p>
                )}
                {quotationsQuery.data?.map((quotation) => (
                  <article
                    key={quotation.id}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-white">{quotation.client}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {quotation.event_type} · {new Date(quotation.event_date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        ${quotation.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-sm text-[var(--muted)]">
                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.4em]">
                        {quotation.status}
                      </span>
                      <button
                        type="button"
                        className="rounded-full border border-white/15 px-3 py-1 text-white/80 hover:text-white"
                        onClick={() => handleSelectQuotation(quotation)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/15 px-3 py-1 text-white/60 hover:text-red-300"
                        onClick={() => deleteQuotation.mutate(quotation.id)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/15 px-3 py-1 text-white/80 hover:text-white"
                        onClick={() => downloadQuotationPdf(quotation.id)}
                      >
                        PDF
                      </button>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="email"
                          placeholder="client@email.com"
                          value={emailTargets[quotation.id] ?? ""}
                          onChange={(event) =>
                            setEmailTargets((prev) => ({ ...prev, [quotation.id]: event.target.value }))
                          }
                          className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                        />
                        <button
                          type="button"
                          disabled={sendEmailMutation.isPending}
                          onClick={() => {
                            const recipient = (emailTargets[quotation.id] ?? "").trim();
                            if (!recipient) {
                              setEmailStatus((prev) => ({
                                ...prev,
                                [quotation.id]: "Enter a recipient email first.",
                              }));
                              return;
                            }
                            sendEmailMutation.mutate({
                              quotationId: quotation.id,
                              recipient,
                            });
                          }}
                          className="rounded-2xl border border-white/15 px-3 py-2 text-white/80 hover:text-white disabled:opacity-50"
                        >
                          {sendEmailMutation.isPending ? "Sending..." : "Send email"}
                        </button>
                      </div>
                      {emailStatus[quotation.id] && (
                        <p className="text-xs text-[var(--muted)]">{emailStatus[quotation.id]}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
