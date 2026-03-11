'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authStorage } from "@/lib/auth";

export function useRequireAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const storedToken = authStorage.read();
    if (!storedToken) {
      router.replace("/login");
    }
    setToken(storedToken ?? null);
  }, [router]);

  return token;
}
