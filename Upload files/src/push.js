import { supabase } from "./supabaseClient";

const VAPID_PUBLIC = "BCmScq3S1-qgrC4xojSvaLTX2HNH4W5A6oPRMSfavz11Ty-BHHsJdy2wDYzlWQKYAuT6uUcWSefsXP1MTuHEaNo";
const toKey = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };

export const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export async function enablePush() {
  if (!pushSupported()) throw new Error("Ce navigateur ne gère pas les notifications sonores. Utilise Chrome sur Android.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Autorisation refusée : active les notifications dans les réglages du navigateur.");
  const registration = await navigator.serviceWorker.register(new URL("sw.js", document.baseURI).href);
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC) }));
  const json = subscription.toJSON();
  const { error } = await supabase.rpc("save_push_subscription", { p_endpoint: json.endpoint, p_p256dh: json.keys.p256dh, p_auth: json.keys.auth });
  if (error) throw new Error(/function|schema cache/i.test(error.message) ? "Le SQL « partie 14 » doit être installé dans Supabase." : error.message);
}
