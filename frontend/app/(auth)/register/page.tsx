'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { FormEvent, useState } from "react";
import { Loader2, Mail, Shield, UserRound } from "lucide-react";

import api from "@/lib/api";
import { authStorage } from "@/lib/auth";

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterPayload>({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/register", form);
      authStorage.save(data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail =
          typeof err.response?.data === "string"
            ? err.response?.data
            : err.response?.data?.detail;
        setError(detail || "Registration failed. Try again shortly.");
      } else {
        setError("Registration failed. Try again shortly.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">
          Create workspace
        </p>
        <h1 className="text-3xl font-semibold text-white">Launch your planning hub</h1>
        <p className="text-sm text-[var(--muted)]">
          Your profile powers bookings, finance tracking, and quotation workflows scheduled for the
          next sprints.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/70">
            <UserRound size={14} /> Full name
          </span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]"
            placeholder="Jordan Avery"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/70">
            <Mail size={14} /> Email
          </span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]"
            placeholder="studio@domain.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[var(--muted)]">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/70">
            <Shield size={14} /> Password
          </span>
          <input
            type="password"
            minLength={6}
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]"
            placeholder="Create a passphrase"
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7ff0d3] to-[#00c896] px-5 py-3 font-semibold uppercase tracking-wide text-[#041417]"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Create account"}
        </button>
      </form>
      <p className="text-sm text-[var(--muted)]">
        Already onboarded? <Link href="/login" className="text-white">Sign in</Link>
      </p>
    </div>
  );
}
