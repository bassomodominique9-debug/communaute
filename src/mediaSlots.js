import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Emplacements d'images gérés depuis la médiathèque (espace administrateur).
let cache = null;
let pending = null;

export function loadSlots() {
  if (!pending) {
    pending = Promise.resolve(supabase.from("media_slots").select("key, url")).then(({ data, error }) => {
      if (error || !Array.isArray(data)) return {};
      cache = Object.fromEntries(data.map((r) => [r.key, r.url]));
      return cache;
    });
  }
  return pending;
}

// Renvoie l'URL affectée à l'emplacement, ou null (le site affiche alors son image par défaut)
export function useSlot(key) {
  const [url, setUrl] = useState(cache ? cache[key] || null : null);
  useEffect(() => {
    let active = true;
    const refresh = () => loadSlots().then((map) => { if (active) setUrl(map[key] || null); });
    refresh();
    window.addEventListener("ed-media-updated", refresh);
    return () => { active = false; window.removeEventListener("ed-media-updated", refresh); };
  }, [key]);
  return url;
}

export function notifyMediaUpdated() {
  pending = null;
  cache = null;
  window.dispatchEvent(new Event("ed-media-updated"));
}
