import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Event Business Tracker",
  description:
    "Integrated toolkit for event planners to manage bookings, finances, and quotations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="grid-overlay" aria-hidden="true" />
        <Providers>
          <div className="fixed right-6 top-6 z-50 hidden lg:block">
            <ThemeToggle />
          </div>
          <div className="fixed bottom-6 right-6 z-50 lg:hidden">
            <ThemeToggle />
          </div>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
