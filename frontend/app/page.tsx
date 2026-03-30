import Link from "next/link";
import { Calendar, LineChart, ShieldCheck, Users, Sparkles } from "lucide-react";

const features = [
  {
    title: "Booking Intelligence",
    description: "Track clients, venues, and timelines from a single live timeline synced to your operations board.",
    icon: Calendar,
  },
  {
    title: "Finance Clarity",
    description: "Surface profit, cost buckets, and outstanding invoices before every planning meeting.",
    icon: LineChart,
  },
  {
    title: "AI-Powered Quotations",
    description: "Generate professional proposals with AI suggestions, export to PDF, and email directly to clients.",
    icon: Sparkles,
  },
  {
    title: "Secure Auth",
    description: "JWT-powered authentication keeps vendor and client data protected end-to-end.",
    icon: ShieldCheck,
  },
];

const targetAudience = [
  { title: "Event Planners", description: "Wedding planners, corporate event coordinators, party organizers" },
  { title: "Small Business Owners", description: "Venues, caterers, photographers, decorators" },
  { title: "Freelancers", description: "Independent contractors managing multiple clients" },
  { title: "Agency Teams", description: "Small agencies needing a simple CRM + financial tool" },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="glass-panel mx-auto flex w-full max-w-6xl flex-col gap-12 bg-gradient-to-br from-white/5 to-white/0 p-10 backdrop-blur-xl">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.6em] text-[var(--muted)]">
              Event Business Tracker
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              Organize bookings, cash flow, and proposals without juggling five apps.
            </h1>
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="cta-button px-8 py-3 text-sm uppercase tracking-wide">
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="ghost-button px-8 py-3 text-sm uppercase tracking-wide text-[var(--muted)]"
              >
                Access Console
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-6">
              {features.map(({ title, description, icon: Icon }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white">{title}</p>
                    <p className="text-sm text-[var(--muted)]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <div className="rounded-full border border-white/10 px-4 py-2">Bookings + finances shipped</div>
          <div className="rounded-full border border-white/10 px-4 py-2">Gemini-powered quotations</div>
          <div className="rounded-full border border-white/10 px-4 py-2">FastAPI + Next.js stack</div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.6em] text-[var(--muted)]">Gemini Assist</p>
              <p className="text-lg font-semibold text-white">Powered by Google Gemini 1.5 Flash</p>
              <p className="text-sm text-[var(--muted)]">
                Briefs are sent from the backend only, with your API key stored in <code>backend/.env</code> so no
                secrets reach the browser. Swap or rotate keys any time without redeploying the UI.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 w-full max-w-4xl space-y-8">
          <h2 className="text-center text-2xl font-semibold text-white">Who is this for?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {targetAudience.map(({ title, description }) => (
              <div key={title} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <Users className="mt-1 h-5 w-5 flex-shrink-0 text-teal-200" />
                <div>
                  <p className="font-medium text-white">{title}</p>
                  <p className="text-sm text-[var(--muted)]">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[var(--muted)]">
            Anyone who needs to track events, invoices, and client relationships without enterprise software complexity.
          </p>
        </div>
      </div>
    </main>
  );
}
