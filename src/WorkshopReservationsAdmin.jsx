import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const LABELS = { pending: "En attente", confirmed: "Confirmé", cancelled: "Annulé", refunded: "Remboursé" };
const FILTERS = [["pending", "En attente"], ["confirmed", "Confirmés"], ["all", "Toutes"]];

export default function WorkshopReservationsAdmin({ onNotify }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [refs, setRefs] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const { data, error: err } = await supabase.rpc("staff_list_workshop_reservations");
    if (err) {
      setError("Impossible de charger les réservations. Vérifie que le SQL « partie 5 » est installé.");
      return;
    }
    setError("");
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(item, status) {
    const reference = (refs[item.id] || "").trim();
    if (status === "confirmed" && reference.length < 4) {
      onNotify?.("Saisis la référence du paiement reçu (4 caractères minimum).");
      return;
    }
    setBusy(item.id);
    const { error: err } = await supabase.rpc("staff_set_reservation_status", {
      p_reservation_id: item.id,
      p_status: status,
      p_reference: reference || null,
    });
    setBusy(null);
    if (err) { onNotify?.(err.message); return; }
    onNotify?.(status === "confirmed" ? "Ticket confirmé. Le client est prévenu." : "Réservation mise à jour.");
    await load();
  }

  const shown = items.filter((item) => filter === "all" || item.status === filter);

  return (
    <section className="reservation-admin">
      <span className="eyebrow">ESPACE ADMINISTRATEUR</span>
      <h2>Valider les tickets</h2>
      <p>Vérifie le paiement reçu (Mobile Money, espèces…), saisis sa référence, puis confirme le ticket.</p>
      <div className="reservation-filters">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className={filter === key ? "reservation-filter active" : "reservation-filter"} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!error && shown.length === 0 && <p className="reservation-empty">Aucune réservation dans cette catégorie.</p>}
      <div className="reservation-list">
        {shown.map((item) => (
          <article key={item.id} className="reservation-item">
            <div className="reservation-item-head">
              <strong>{item.full_name}</strong>
              <span className={`reservation-status reservation-status-${item.status}`}>{LABELS[item.status] || item.status}</span>
            </div>
            <p>{item.workshop_title} · {Number(item.amount_xaf).toLocaleString("fr-FR")} FCFA</p>
            {item.transaction_id && <p>ID transaction du client : <strong>{item.transaction_id}</strong></p>}
            <p><a href={`tel:${item.phone}`}>{item.phone}</a> · {new Date(item.created_at).toLocaleDateString("fr-FR")}</p>
            {item.status === "pending" && (
              <div className="reservation-actions">
                <input placeholder="Retape l'ID de transaction du client" value={refs[item.id] || ""} maxLength={60} onChange={(event) => setRefs((prev) => ({ ...prev, [item.id]: event.target.value }))} />
                <button type="button" className="button button-primary" disabled={busy === item.id} onClick={() => setStatus(item, "confirmed")}>Confirmer le ticket</button>
                <button type="button" className="button button-outline" disabled={busy === item.id} onClick={() => setStatus(item, "cancelled")}>Annuler</button>
              </div>
            )}
            {item.status === "confirmed" && item.payment_reference && <p>Référence : <strong>{item.payment_reference}</strong></p>}
          </article>
        ))}
      </div>
    </section>
  );
}
