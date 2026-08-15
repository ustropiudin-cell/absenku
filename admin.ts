import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// PERINGATAN: hanya boleh dipakai di server (server actions / route handlers).
// Memakai service role key yang punya akses penuh, melewati RLS.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
