import { useEffect } from "react";
import { supabase } from "./supabaseClient";

// Applique le code de parrainage saisi à l'inscription (ou repris depuis le lien ?ref=).
// Le code est gardé en session jusqu'à ce que le compte soit connecté.
const KEY = "ed-pending-ref";

async function applyPending() {
  let code = null;
  try { code = sessionStorage.getItem(KEY); } catch (e) { return; }
  if (!code) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase.rpc("apply_referral_code", { p_code: code });
  try { sessionStorage.removeItem(KEY); } catch (e) { /* sans conséquence */ }
  if (!error) window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: "Code de parrainage enregistré." }));
}

export default function PendingReferral() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) { try { sessionStorage.setItem(KEY, ref.trim().toUpperCase()); } catch (e) { /* ignoré */ } }
    applyPending();
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "SIGNED_IN") applyPending(); });
    return () => data?.subscription?.unsubscribe?.();
  }, []);
  return null;
}
