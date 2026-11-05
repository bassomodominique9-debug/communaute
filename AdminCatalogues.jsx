import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./catalogue-entreprises.css";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const LABEL = { en_attente: "En attente", publie: "Publié", ferme: "Fermé", refuse: "Non retenu" };

export default function AdminCatalogues() {
  const [list, setList] = useState(null);
  async function load() {
    const { data, error } = await supabase.rpc("admin_list_catalogues");
    if (error) { notify(error.message); setList([]); return; }
    setList(Array.isArray(data) ? data : []);
  }
  const [pays, setPays] = useState([]);
  async function loadPays() {
    const { data } = await supabase.rpc("admin_list_pending_payments");
    setPays(Array.isArray(data) ? data : []);
  }
  async function confirmPay(id) {
    if (!window.confirm("Confirmer ce paiement ?")) return;
    const { error } = await supabase.rpc("admin_confirm_catalogue_payment", { p_id: id });
    if (error) notify(error.message); else { loadPays(); load(); }
  }
  useEffect(() => { load(); loadPays(); }, []);
  async function setStatus(id, status, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    const { error } = await supabase.rpc("admin_set_catalogue_status", { p_id: id, p_status: status });
    if (error) notify(error.message); else load();
  }
  if (list === null) return <p className="ce-note">Chargement…</p>;
  const paysBlock = pays.length > 0 && (
    <div className="ce-admin-card">
      <strong>Paiements à confirmer ({pays.length})</strong>
      {pays.map((p) => (
        <div key={p.id} className="ce-admin-actions">
          <small>{p.catalogue} · {p.months} mois · {Number(p.amount).toLocaleString("fr-FR")} FCFA · réf. {p.transaction_id}</small>
          <a href={p.proof_url} target="_blank" rel="noopener noreferrer">Voir la preuve</a>
          <button type="button" onClick={() => confirmPay(p.id)}>Confirmer</button>
        </div>
      ))}
    </div>
  );
  if (list.length === 0) return <p className="ce-note">Aucun catalogue d'entreprise pour le moment.</p>;
  return (
    <section className="ce-admin">
      {paysBlock}
      {list.map((c) => (
        <article key={c.id} className="ce-admin-card">
          <div className="ce-admin-top">
            <img src={c.logo_url} alt="" />
            <div><strong>{c.name}</strong><small>{c.domaine} · {c.city}</small></div>
            <span className={`ce-status ce-status-${c.status}`}>{LABEL[c.status] || c.status}</span>
          </div>
          <small>Signalements : {c.signalements} / 10 · WhatsApp : {c.whatsapp}</small>
          <div className="ce-admin-actions">
            {(c.status === "en_attente" || c.status === "refuse") && <button type="button" onClick={() => setStatus(c.id, "publie")}>Publier</button>}
            {c.status === "en_attente" && <button type="button" className="ce-danger" onClick={() => setStatus(c.id, "refuse", "Refuser ce catalogue ?")}>Refuser</button>}
            {c.status === "publie" && <button type="button" className="ce-danger" onClick={() => setStatus(c.id, "ferme", "Fermer ce catalogue ?")}>Fermer</button>}
            {c.status === "ferme" && <button type="button" onClick={() => setStatus(c.id, "publie", "Rouvrir ce catalogue ?")}>Rouvrir</button>}
          </div>
        </article>
      ))}
    </section>
  );
}
