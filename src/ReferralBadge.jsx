import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const go = () => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: "referral" }));
const fmt = (n) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`;

// Solde affiché en haut à droite, avec « clique ici »
export function HeaderBalance() {
  const [value, setValue] = useState(null);
  useEffect(() => {
    supabase.rpc("my_referral_hub").then(({ data, error }) => {
      if (!error && data && typeof data.available === "number") setValue(data.available);
    });
  }, []);
  if (value === null) return null;
  return (
    <button type="button" className="header-balance" onClick={go} aria-label={`Solde parrainage ${fmt(value)}, cliquer ici`}>
      <span className="header-balance-amount">{fmt(value)}</span>
      <small>clique ici</small>
    </button>
  );
}

// Carte de parrainage dans Mon espace : code, lien et solde
export default function ReferralBadge() {
  const [code, setCode] = useState(null);
  const [value, setValue] = useState(null);
  useEffect(() => {
    supabase.rpc("ensure_my_code").then(({ data, error }) => { if (!error && data && !data.expired) setCode(data.code); });
    supabase.rpc("my_referral_hub").then(({ data, error }) => {
      if (!error && data && typeof data.available === "number") setValue(data.available);
    });
  }, []);
  if (value === null && code === null) return null;
  return (
    <button type="button" className="referral-badge" onClick={go}>
      <span>Mon code {code || ""}</span>
      <strong>Solde {fmt(value)}</strong>
    </button>
  );
}
