import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key: bypasa RLS y puede crear usuarios de
 * auth.users directamente (supabase.auth.admin.*). Nunca importar desde
 * un componente cliente ni exponer SUPABASE_SERVICE_ROLE_KEY con NEXT_PUBLIC_.
 * Cada caller es responsable de verificar el rol del usuario antes de usarlo.
 */
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
