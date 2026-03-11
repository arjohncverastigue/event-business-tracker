const STORAGE_KEY = "ebt_token";

export const authStorage = {
  save(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, token);
  },
  read() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
