import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

const PKCE_COOKIE_MARKER = "code-verifier";
const PKCE_COOKIE_MAX_AGE = 10 * 60;

function isPkceKey(key: string) {
  return key.includes(PKCE_COOKIE_MARKER);
}

function cookieStorage() {
  return {
    getItem(key: string) {
      if (typeof document === "undefined") return null;
      if (!isPkceKey(key)) return window.localStorage.getItem(key);
      const item = document.cookie.split("; ").find((part) => part.startsWith(`${encodeURIComponent(key)}=`));
      return item ? decodeURIComponent(item.slice(item.indexOf("=") + 1)) : null;
    },
    setItem(key: string, value: string) {
      if (typeof document === "undefined") return;
      if (!isPkceKey(key)) {
        window.localStorage.setItem(key, value);
        return;
      }
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; Max-Age=${PKCE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    },
    removeItem(key: string) {
      if (typeof document === "undefined") return;
      if (!isPkceKey(key)) {
        window.localStorage.removeItem(key);
        return;
      }
      document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=/; SameSite=Lax`;
    },
  };
}

export function getSupabaseBrowserClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storage: cookieStorage(),
    },
  });
  return client;
}
