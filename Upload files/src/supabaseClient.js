import { createClient } from "@supabase/supabase-js";

// Ces valeurs publiques servent au client navigateur. La sécurité doit être assurée
// par les politiques RLS et les fonctions SQL, jamais par la clé côté interface.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://jvwmkoshkkzupgrjcttx.supabase.co";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ojrPvKcGUnlIGvxwVx2f3Q_DDtp3mk8";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
