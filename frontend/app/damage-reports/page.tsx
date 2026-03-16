'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, ShieldAlert, Trash2, X } from 'lucide-react';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import api from '@/lib/api';
import type { DamageReport, Equipment } from '@/types';

const damageReportDefaults = {
  equipment_id: 0,
  client: '',
  description: '',
  date_reported: new Date().toISOString().slice(0, 16),
  repair_cost: 0,
  status: 'pending_repair',
};

type DamageReportFormState = typeof damageReportDefaults;

const fetchDamageReports = async (): Promise<DamageReport[]> => {
  const { data } = await api.get('/damage-reports');
  return data;
};

const fetchEquipment = async (): Promise<Equipment[]> => {
  const { data } = await api.get('/equipment');
  return data;
};

export default function DamageReportsPage() {
  const token = useRequireAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DamageReportFormState>(damageReportDefaults);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const damageReportsQuery = useQuery({
    queryKey: ['damage-reports'],
    queryFn: fetchDamageReports,
    enabled: Boolean(token),
  });

  const equipmentQuery = useQuery({
    queryKey: ['equipment'],
    queryFn: fetchEquipment,
    enabled: Boolean(token),
  });

  const createDamageReport = useMutation({
    mutationFn: async (payload: DamageReportFormState) => {
      const response = await api.post('/damage-reports', {
        ...payload,
        date_reported: new Date(payload.date_reported).toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
      setForm(damageReportDefaults);
    },
  });

  const updateDamageReport = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: DamageReportFormState }) => {
      const response = await api.put(`/damage-reports/${id}`, {
        ...payload,
        date_reported: new Date(payload.date_reported).toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] });
      setEditingId(null);
      setForm(damageReportDefaults);
    },
  });

  const deleteDamageReport = useMutation({
    mutationFn: async (damageReportId: number) => api.delete(`/damage-reports/${damageReportId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['damage-reports'] }),
  });

  const filteredReports = useMemo(() => {
    if (!damageReportsQuery.data) return [];

    let result = [...damageReportsQuery.data];

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    return result;
  }, [damageReportsQuery.data, statusFilter]);

  const totalRepairCost = useMemo(() => {
    if (!filteredReports) return 0;
    return filteredReports.reduce((sum, r) => sum + Number(r.repair_cost || 0), 0);
  }, [filteredReports]);

  const handleEdit = (report: DamageReport) => {
    setEditingId(report.id);
    setForm({
      equipment_id: report.equipment_id,
      client: report.client,
      description: report.description,
      date_reported: new Date(report.date_reported).toISOString().slice(0, 16),
      repair_cost: report.repair_cost,
      status: report.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(damageReportDefaults);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.equipment_id) return;
    if (editingId) {
      updateDamageReport.mutate({ id: editingId, payload: form });
    } else {
      createDamageReport.mutate(form);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">Audit Trail</p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white">Damage Reports</h1>
              <p className="text-sm text-[var(--muted)]">
                Track damaged items and repair costs.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-right">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Total Repair Cost</p>
              <p className="text-2xl font-semibold text-white">${totalRepairCost.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <form
            className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center gap-3 text-white">
              <ShieldAlert size={20} />
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">
                  {editingId ? 'Edit report' : 'Report damage'}
                </p>
                <p className="text-lg font-semibold">
                  {editingId ? 'Update report' : 'New damage report'}
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                  Equipment
                </span>
                <select
                  value={form.equipment_id}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, equipment_id: parseInt(event.target.value) }))
                  }
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  required
                >
                  <option value={0}>Select equipment...</option>
                  {equipmentQuery.data?.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                  Client Name
                </span>
                <input
                  type="text"
                  value={form.client}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, client: event.target.value }))
                  }
                  placeholder="e.g., John Doe"
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  required
                />
              </label>
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                  Description of Damage
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Describe the damage..."
                  required
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                    Date Reported
                  </span>
                  <input
                    type="datetime-local"
                    value={form.date_reported}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, date_reported: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                    required
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                    Repair Cost (USD)
                  </span>
                  <input
                    type="number"
                    value={form.repair_cost}
                    min="0"
                    step="10"
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, repair_cost: parseFloat(event.target.value) || 0 }))
                    }
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  />
                </label>
              </div>
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                >
                  <option value="pending_repair">Pending Repair</option>
                  <option value="repaired">Repaired</option>
                  <option value="written_off">Written Off</option>
                </select>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createDamageReport.isPending || updateDamageReport.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7ff0d3] to-[#00c896] px-5 py-3 font-semibold uppercase tracking-wide text-[#041417]"
              >
                {(createDamageReport.isPending || updateDamageReport.isPending) ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  editingId ? 'Update' : 'Save Report'
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-2xl border border-white/15 px-4 py-3 text-white/70 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {(createDamageReport.isError || updateDamageReport.isError) && (
              <p className="text-sm text-red-300">Unable to save. Please try again.</p>
            )}
          </form>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Reports List</p>
                {damageReportsQuery.isFetching && (
                  <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
                )}
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
              >
                <option value="all">All Status</option>
                <option value="pending_repair">Pending Repair</option>
                <option value="repaired">Repaired</option>
                <option value="written_off">Written Off</option>
              </select>
            </div>
            <div className="space-y-3">
              {filteredReports.length === 0 && (
                <p className="text-sm text-[var(--muted)]">
                  No damage reports found.
                </p>
              )}
              {filteredReports.map((report) => (
                <article
                  key={report.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:gap-6"
                >
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white">{report.equipment_name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      Client: {report.client}
                    </p>
                    <p className="text-xs text-white/50 line-clamp-2 mt-1">
                      {report.description}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(report.date_reported))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-white">
                      ${Number(report.repair_cost).toLocaleString()}
                    </p>
                    <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
                      {report.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(report)}
                      className="self-start rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDamageReport.mutate(report.id)}
                      className="self-start rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                      title="Delete"
                    >
                      {deleteDamageReport.isPending ? (
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
