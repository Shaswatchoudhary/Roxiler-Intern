import { createClient } from "@supabase/supabase-js";

// Safely access Vite env in browser; fall back to process.env if present
const env =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : undefined;

const supabaseUrl =
  env?.VITE_SUPABASE_URL ??
  (typeof process !== "undefined"
    ? process.env?.VITE_SUPABASE_URL
    : undefined) ??
  (typeof process !== "undefined"
    ? process.env?.NEXT_PUBLIC_SUPABASE_URL
    : undefined) ??
  (typeof process !== "undefined"
    ? process.env?.REACT_APP_SUPABASE_URL
    : undefined);

const supabaseAnonKey =
  env?.VITE_SUPABASE_ANON_KEY ??
  (typeof process !== "undefined"
    ? process.env?.VITE_SUPABASE_ANON_KEY
    : undefined) ??
  (typeof process !== "undefined"
    ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : undefined) ??
  (typeof process !== "undefined"
    ? process.env?.REACT_APP_SUPABASE_ANON_KEY
    : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl ? "VITE_SUPABASE_URL" : null,
    !supabaseAnonKey ? "VITE_SUPABASE_ANON_KEY" : null,
  ]
    .filter(Boolean)
    .join(", ");
  throw new Error(
    `Missing Supabase env vars: ${missing}.\n` +
      `Add them to a .env.local file at the project root (Vite):\n` +
      `VITE_SUPABASE_URL=your_project_url\nVITE_SUPABASE_ANON_KEY=your_anon_key`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
