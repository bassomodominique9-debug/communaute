import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./communication.css";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 33 » dans Supabase." : e?.message || "Erreur");
const CHANNELS = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", whatsapp: "WhatsApp", site: "Site" };
const STATUSES = { idea: "Idée", draft: "Brouillon", scheduled: "Planifié", published: "Publié" };
const blank = { id: null, title: "", channel: "facebook", planned_on: "", status: "idea", note: "" };

export default function CommunicationSpace() {
  const [access, setAccess] = useState(null);
  const [tab, setTab] = useState("plan");

  useEffect(() => {
    supabase.rpc("comm_my_access").then(({ data, error }) => setAccess(!error && data === true));
  }, []);

  if (access === null) return <section className="section-container comm"><p>Chargement…</p></section>;
  if (!access) return (
    <section className="section-container comm">
      <h1>Communication</h1>
      <p>Cet espace est réservé à l'équipe communication.</p>
    </section>
  );

  return (
    <section className="section-container comm" aria-label="Espace communication">
      <span className="eyebrow">COMMUNICATION</span>
      <h1>Espace communication</h1>
      <nav className="pq-tabs" role="tablist">
        {[["plan", "Plan"], ["diffuser", "Diffuser"], ["stats", "Statistiques"]].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "pq-tab pq-tab-on" : "pq-tab"} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      {tab === "plan" && <PlanTab />}
      {tab === "diffuser" && <BroadcastTab />}
      {tab === "stats" && <StatsTab />}
    </section>
  );
}

function PlanTab() {
  const [items, setItems] = useState([]);
  const [f, setF] = useState(blank);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("comm_list_plan");
    if (error) { notify(errMsg(error)); return; }
    setItems(Array.isArray(data) ? data : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(event) {
    event.preventDefault();
    const { error } = await supabase.rpc("comm_save_plan", {
      p_id: f.id, p_title: f.title, p_channel: f.channel, p_planned_on: f.planned_on || null, p_status: f.status, p_note: f.note,
    });
    if (error) { notify(errMsg(error)); return; }
    notify(f.id ? "Contenu mis à jour." : "Contenu ajouté au plan.");
    setF(blank); load();
  }

  async function remove(id) {
    if (!window.confirm("Supprimer ce contenu du plan ?")) return;
    const { error } = await supabase.rpc("comm_delete_plan", { p_id: id });
    if (error) { notify(errMsg(error)); return; }
    load();
  }

  return (
    <>
      <form className="account-content-card admin-form" onSubmit={save}>
        <h3>{f.id ? "Modifier un contenu" : "Nouveau contenu"}</h3>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Titre ou sujet" required maxLength={160} />
        <div className="seeker-row">
          <select value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
            {Object.entries(CHANNELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <label>Date prévue<input type="date" value={f.planned_on} onChange={(e) => setF({ ...f, planned_on: e.target.value })} /></label>
        <textarea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note (lien, visuel, objectif)" maxLength={500} />
        <div className="comm-actions">
          <button type="submit" className="button button-primary">{f.id ? "Enregistrer" : "Ajouter au plan"}</button>
          {f.id && <button type="button" className="button button-outline" onClick={() => setF(blank)}>Annuler</button>}
        </div>
      </form>

      <div className="account-content-card">
        <h3>Plan de contenus ({items.length})</h3>
        {items.length === 0 && <p>Aucun contenu planifié.</p>}
        {items.map((it) => (
          <div key={it.id} className="admin-row comm-row">
            <div>
              <strong>{it.title}</strong>
              <p>{CHANNELS[it.channel]} · {STATUSES[it.status]}{it.planned_on ? ` · ${new Date(it.planned_on).toLocaleDateString("fr-FR")}` : ""}</p>
              {it.note && <small>{it.note}</small>}
            </div>
            <div className="comm-actions">
              <button type="button" className="button button-outline" onClick={() => setF({ ...it, planned_on: it.planned_on || "", note: it.note || "" })}>Modifier</button>
              <button type="button" className="button button-danger" onClick={() => remove(it.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function BroadcastTab() {
  const [f, setF] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);

  async function send(event) {
    event.preventDefault();
    if (!window.confirm("Envoyer ce message à tous les membres ?")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("comm_broadcast", { p_title: f.title, p_body: f.body });
    setBusy(false);
    if (error) { notify(errMsg(error)); return; }
    notify(`Message envoyé à ${data?.sent_to ?? 0} membre(s).`);
    setF({ title: "", body: "" });
  }

  return (
    <form className="account-content-card admin-form" onSubmit={send}>
      <h3>Diffuser un message à tous les membres</h3>
      <p>Apparaît dans les notifications de chaque membre. Limite : 3 diffusions par jour.</p>
      <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Titre (ex. Nouvelle formation)" required maxLength={80} />
      <textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Message court" required maxLength={200} />
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Envoi…" : "Envoyer à tous"}</button>
    </form>
  );
}

function StatsTab() {
  const [s, setS] = useState(null);
  useEffect(() => {
    supabase.rpc("comm_stats").then(({ data, error }) => { if (!error) setS(data); else notify(errMsg(error)); });
  }, []);
  if (!s) return <p>Chargement…</p>;
  const cards = [
    ["Membres", s.members], ["Nouveaux (7 j)", s.new_members_7d], ["Candidatures (7 j)", s.applications_7d],
    ["Offres publiées", s.offers_published], ["Profils emploi", s.seekers], ["Commandes photo (7 j)", s.photo_orders_7d],
    ["Devis nouveaux", s.quotes_new], ["Parrainages validés", s.referrals_validated],
  ];
  return (
    <div className="pm-kpis comm-kpis">
      {cards.map(([label, value]) => (<div key={label}><span>{label}</span><strong>{value ?? 0}</strong></div>))}
    </div>
  );
}
