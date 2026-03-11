'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { FormEvent, useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";

import api from "@/lib/api";
import { authStorage } from "@/lib/auth";

type LoginPayload = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginPayload>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login", form);
      authStorage.save(data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail =
          typeof err.response?.data === "string"
            ? err.response?.data
            : err.response?.data?.detail;
        setError(detail || "Unable to log in. Please check your credentials.");
      } else {
        setError("Unable to log in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">
          Welcome back
        </p>
        <h1 className="text-3xl font-semibold text-white">Access your control room</h1>
        <p className="text-sm text-[var(--muted)]">
          Sync bookings, payments, and proposals for every event in your pipeline.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/70">
            <Mail size={14} /> Email
          </span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]"
            placeholder="you@studio.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/70">
            <Lock size={14} /> Password
          </span>
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]"
            placeholder="••••••••"
          />
        </label>
        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/90 px-5 py-3 font-semibold uppercase tracking-wide text-[#041417] transition hover:bg-white"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Launch dashboard"}
        </button>
      </form>
      <p className="text-sm text-[var(--muted)]">
        Need an account? <Link href="/register" className="text-white">Create one</Link>
      </p>
    </div>
  );
}
