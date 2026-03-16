'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Loader2, Pencil, Trash2, X } from 'lucide-react';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import api from '@/lib/api';
import type { Booking } from '@/types';

const bookingDefaults = {
  client: '',
  event_type: '',
  event_date: new Date().toISOString().slice(0, 16),
  venue: '',
  amount: '',
  status: 'pending',
  notes: '',
};

type BookingFormState = typeof bookingDefaults;

const fetchBookings = async (): Promise<Booking[]> => {
  const { data } = await api.get('/bookings');
  return data;
};

export default function BookingsPage() {
  const token = useRequireAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BookingFormState>(bookingDefaults);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
    enabled: Boolean(token),
  });

  const createBooking = useMutation({
    mutationFn: async (payload: BookingFormState) => {
      const response = await api.post('/bookings', {
        ...payload,
        amount: Number(payload.amount),
        event_date: new Date(payload.event_date).toISOString(),
        notes: payload.notes || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setForm(bookingDefaults);
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: BookingFormState }) => {
      const response = await api.put(`/bookings/${id}`, {
        ...payload,
        amount: Number(payload.amount),
        event_date: new Date(payload.event_date).toISOString(),
        notes: payload.notes || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setEditingId(null);
      setForm(bookingDefaults);
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (bookingId: number) => api.delete(`/bookings/${bookingId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const filteredBookings = useMemo(() => {
    if (!bookingsQuery.data) return [];

    let result = [...bookingsQuery.data];

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      } else if (dateFilter === 'year') {
        filterDate.setFullYear(now.getFullYear() - 1);
      }

      result = result.filter((b) => new Date(b.created_at) >= filterDate);
    }

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [bookingsQuery.data, statusFilter, dateFilter]);

  const totalValue = useMemo(() => {
    if (!filteredBookings) return 0;
    return filteredBookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  }, [filteredBookings]);

  const handleEdit = (booking: Booking) => {
    setEditingId(booking.id);
    setForm({
      client: booking.client,
      event_type: booking.event_type,
      event_date: new Date(booking.event_date).toISOString().slice(0, 16),
      venue: booking.venue,
      amount: String(booking.amount),
      status: booking.status,
      notes: booking.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(bookingDefaults);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateBooking.mutate({ id: editingId, payload: form });
    } else {
      createBooking.mutate(form);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">Bookings</p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white">Pipeline Overview</h1>
              <p className="text-sm text-[var(--muted)]">
                Track every client, venue, and delivery date in one command center.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-right">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Total Value</p>
              <p className="text-2xl font-semibold text-white">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <form
            className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center gap-3 text-white">
              <CalendarPlus size={20} />
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">
                  {editingId ? 'Edit booking' : 'Add booking'}
                </p>
                <p className="text-lg font-semibold">
                  {editingId ? 'Update engagement' : 'New engagement'}
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { label: 'Client', name: 'client', type: 'text', placeholder: 'Avery Agency' },
                { label: 'Event type', name: 'event_type', type: 'text', placeholder: 'Corporate Gala' },
                { label: 'Venue', name: 'venue', type: 'text', placeholder: 'Harbor Hall' },
              ].map((field) => (
                <label key={field.name} className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                    {field.label}
                  </span>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name as keyof BookingFormState]}
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
                <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                  Event date
                </span>
                <input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, event_date: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                  required
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm text-[var(--muted)]">
                  <span className="mb-1 block text-xs uppercase tracking-[0.4em] text-white/60">
                    Amount (USD)
                  </span>
                  <input
                    type="number"
                    value={form.amount}
                    min="0"
                    step="100"
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"
                    required
                  />
                </label>
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
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
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
                  placeholder="Timeline expectations, vendor needs..."
                />
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createBooking.isPending || updateBooking.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7ff0d3] to-[#00c896] px-5 py-3 font-semibold uppercase tracking-wide text-[#041417]"
              >
                {(createBooking.isPending || updateBooking.isPending) ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  editingId ? 'Update booking' : 'Save booking'
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
            {(createBooking.isError || updateBooking.isError) && (
              <p className="text-sm text-red-300">Unable to save booking. Please try again.</p>
            )}
          </form>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Active events</p>
                {bookingsQuery.isFetching && (
                  <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 1 Week</option>
                  <option value="month">Last 1 Month</option>
                  <option value="year">Last 1 Year</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {filteredBookings.length === 0 && (
                <p className="text-sm text-[var(--muted)]">
                  No bookings found. Create your first engagement.
                </p>
              )}
              {filteredBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:gap-6"
                >
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white">{booking.client}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {booking.event_type} · {booking.venue}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(booking.event_date))}
                    </p>
                    {booking.notes && (
                      <p className="mt-1 text-xs text-white/50 line-clamp-2">{booking.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-white">
                      ${Number(booking.amount).toLocaleString()}
                    </p>
                    <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
                      {booking.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(booking)}
                      className="self-start rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                      title="Edit booking"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBooking.mutate(booking.id)}
                      className="self-start rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
                      title="Remove booking"
                    >
                      {deleteBooking.isPending ? (
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
