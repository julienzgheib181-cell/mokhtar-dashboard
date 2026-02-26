import { createClient } from "@supabase/supabase-js";

// Server-side client (Service Role) for cron jobs / secure API routes.
// IMPORTANT: never expose SERVICE_ROLE_KEY to the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
