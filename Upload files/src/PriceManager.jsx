import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function PriceManager({ catalog, onNotify }) {
  const [rows, setRows] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    supabase.from("catalog_prices").select("*").then(({ data, error }) => {
      if (error) { onNotify?.("Installe le SQL « partie 13 » dans Supabase."); return; }
      setSaved(Object.fromEntries((data || []).map((r) => [r.item_key, r])));
    });
  }, []);

  const val = (item, field, fallback) => rows[item.key]?.[field] ?? saved[item.key]?.[field] ?? fallback ?? "";
  const set = (item, field) => (event) => setRows((prev) => ({ ...prev, [item.key]: { ...prev[item.key], [field]: event.target.value } }));

  async function save(item, kind) {
    const num = (v) => (v === "" || v == null ? null : Math.max(0, parseInt(v, 10) || 0));
    const { error } = await supabase.rpc("staff_set_price", {
      p_key: item.key, p_kind: kind, p_label: item.label,
      p_price: num(val(item, "price_xaf", item.price)), p_old: kind === "course" ? num(val(item, "old_price_xaf", item.old)) : null,
      p_text: kind === "service" ? String(val(item, "price_text", item.text)).trim() : null,
    });
    if (error) { onNotify?.(error.message); return; }
    onNotify?.("Prix mis à jour.");
    window.dispatchEvent(new Event("ed-prices-updated"));
  }

  return (
    <div className="account-content-card">
      <h3>Prix des formations et des services</h3>
      <p>Pour une offre, renseigne aussi l'ancien prix (plus élevé) : les membres reçoivent une notification « Nouvelle offre ».</p>
      <h3>Formations</h3>
      {catalog.courses.map((item) => (
        <div className="admin-row" key={item.key}>
          <div style={{ flex: 1 }}><strong>{item.label}</strong>
            <input type="number" min="0" value={val(item, "price_xaf", item.price)} onChange={set(item, "price_xaf")} placeholder="Prix (FCFA)" />
            <input type="number" min="0" value={val(item, "old_price_xaf", item.old)} onChange={set(item, "old_price_xaf")} placeholder="Ancien prix pour une offre (facultatif)" />
          </div>
          <button type="button" className="button button-primary" onClick={() => save(item, "course")}>Enregistrer</button>
        </div>
      ))}
      <h3>Services</h3>
      {catalog.services.map((item) => (
        <div className="admin-row" key={item.key}>
          <div style={{ flex: 1 }}><strong>{item.label}</strong>
            <input value={val(item, "price_text", item.text)} onChange={set(item, "price_text")} placeholder="Prix affiché (ex. À partir de 5 000 FCFA)" maxLength={60} />
          </div>
          <button type="button" className="button button-primary" onClick={() => save(item, "service")}>Enregistrer</button>
        </div>
      ))}
    </div>
  );
}
