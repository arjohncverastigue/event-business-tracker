'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Loader2, Trash2 } from 'lucide-react';

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

  const deleteBooking = useMutation({
    mutationFn: async (bookingId: number) => api.delete(`/bookings/${bookingId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const totalValue = useMemo(() => {
    if (!bookingsQuery.data) return 0;
    return bookingsQuery.data.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
  }, [bookingsQuery.data]);

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
            onSubmit={(event) => {
              event.preventDefault();
              createBooking.mutate(form);
            }}
          >
            <div className="flex items-center gap-3 text-white">
              <CalendarPlus size={20} />
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">Add booking</p>
                <p className="text-lg font-semibold">New engagement</p>
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
            <button
              type="submit"
              disabled={createBooking.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7ff0d3] to-[#00c896] px-5 py-3 font-semibold uppercase tracking-wide text-[#041417]"
            >
              {createBooking.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Save booking'
              )}
            </button>
            {createBooking.isError && (
              <p className="text-sm text-red-300">Unable to save booking. Please try again.</p>
            )}
          </form>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Active events</p>
              {bookingsQuery.isFetching && (
                <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
              )}
            </div>
            <div className="space-y-3">
              {bookingsQuery.data && bookingsQuery.data.length === 0 && (
                <p className="text-sm text-[var(--muted)]">
                  No bookings yet. Create your first engagement.
                </p>
              )}
              {bookingsQuery.data?.map((booking) => (
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
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-white">
                      ${Number(booking.amount).toLocaleString()}
                    </p>
                    <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">
                      {booking.status}
                    </p>
                  </div>
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
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
