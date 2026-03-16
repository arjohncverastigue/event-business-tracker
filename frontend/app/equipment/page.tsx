'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Package, Pencil, Trash2, X } from 'lucide-react';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import api from '@/lib/api';
import type { Equipment } from '@/types';

const equipmentDefaults = {
  name: '',
  category: '',
  quantity: 1,
  condition: 'good',
  availability_status: 'available',
  notes: '',
};

type EquipmentFormState = typeof equipmentDefaults;

const fetchEquipment = async (): Promise<Equipment[]> => {
  const { data } = await api.get('/equipment');
  return data;
};

export default function EquipmentPage() {
  const token = useRequireAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EquipmentFormState>(equipmentDefaults);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const equipmentQuery = useQuery({
    queryKey: ['equipment'],
    queryFn: fetchEquipment,
    enabled: Boolean(token),
  });

  const createEquipment = useMutation({
    mutationFn: async (payload: EquipmentFormState) => {
      const response = await api.post('/equipment', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setForm(equipmentDefaults);
    },
  });

  const updateEquipment = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: EquipmentFormState }) => {
      const response = await api.put(`/equipment/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setEditingId(null);
      setForm(equipmentDefaults);
    },
  });

  const deleteEquipment = useMutation({
    mutationFn: async (equipmentId: number) => api.delete(`/equipment/${equipmentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] }),
  });

  const filteredEquipment = useMemo(() => {
    if (!equipmentQuery.data) return [];

    let result = [...equipmentQuery.data];

    if (categoryFilter !== 'all') {
      result = result.filter((e) => e.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((e) => e.availability_status === statusFilter);
    }

    return result;
  }, [equipmentQuery.data, categoryFilter, statusFilter]);

  const categories = useMemo(() => {
    if (!equipmentQuery.data) return [];
    return [...new Set(equipmentQuery.data.map((e) => e.category))];
  }, [equipmentQuery.data]);

  const totalQuantity = useMemo(() => {
    if (!filteredEquipment) return 0;
    return filteredEquipment.reduce((sum, e) => sum + Number(e.quantity || 0), 0);
  }, [filteredEquipment]);

  const handleEdit = (equipment: Equipment) => {
    setEditingId(equipment.id);
    setForm({
      name: equipment.name,
      category: equipment.category,
      quantity: equipment.quantity,
      condition: equipment.condition,
      availability_status: equipment.availability_status,
      notes: equipment.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(equipmentDefaults);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateEquipment.mutate({ id: editingId, payload: form });
    } else {
      createEquipment.mutate(form);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">Inventory</p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white">Equipment</h1>
              <p className="text-sm text-[var(--muted)]">
                Manage your rental equipment and track availability.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-right">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Total Items</p>
              <p className="text-2xl font-semibold text-white">{totalQuantity}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
          <form
            className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center gap-3 text-white">
              <Package size={20} />
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">
                  {editingId ? 'Edit equipment' : 'Add equipment'}
                </p>
                <p className="text-lg font-semibold">
                  {editingId ? 'Update item' : 'New item'}
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                  Equipment Name
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g., Wireless Microphone"
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  required
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                    Category
                  </span>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                    placeholder="e.g., Audio"
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                    required
                  />
                </label>
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                    Quantity
                  </span>
                  <input
                    type="number"
                    value={form.quantity}
                    min="0"
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, quantity: parseInt(event.target.value) || 0 }))
                    }
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                    Condition
                  </span>
                  <select
                    value={form.condition}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, condition: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </label>
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                    Status
                  </span>
                  <select
                    value={form.availability_status}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, availability_status: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </label>
              </div>
              <label className="text-sm text-[var(--muted)]">
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  placeholder="Additional details..."
                />
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createEquipment.isPending || updateEquipment.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7ff0d3] to-[#00c896] px-5 py-3 font-semibold uppercase tracking-wide text-[#041417]"
              >
                {(createEquipment.isPending || updateEquipment.isPending) ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  editingId ? 'Update' : 'Save'
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
            {(createEquipment.isError || updateEquipment.isError) && (
              <p className="text-sm text-red-300">Unable to save. Please try again.</p>
            )}
          </form>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Inventory List</p>
                {equipmentQuery.isFetching && (
                  <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {filteredEquipment.length === 0 && (
                <p className="text-sm text-[var(--muted)]">
                  No equipment found. Add your first item.
                </p>
              )}
              {filteredEquipment.map((equipment) => (
                <article
                  key={equipment.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:gap-6"
                >
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white">{equipment.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {equipment.category}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Qty: {equipment.quantity} · Condition: {equipment.condition}
                    </p>
                    {equipment.notes && (
                      <p className="mt-1 text-xs text-white/50 line-clamp-2">{equipment.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
                      {equipment.availability_status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(equipment)}
                      className="self-start rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEquipment.mutate(equipment.id)}
                      className="self-start rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                      title="Delete"
                    >
                      {deleteEquipment.isPending ? (
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
