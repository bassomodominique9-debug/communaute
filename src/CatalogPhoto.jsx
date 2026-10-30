import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import PaymentFlow from "./PaymentFlow";
import { studioConfigFrom, studioQuote } from "./pricing";
import { PhotoGallery } from "./CatalogPages";
import { useSlot } from "./mediaSlots";
import "./catalog.css";

const go = (page) => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page }));
const fmt = (n) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`;
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 27 » dans Supabase." : e?.message || "Erreur");
const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));

function CoverCard({ slot, title, desc, page }) {
  const url = useSlot(slot);
  return (
    <button type="button" className="catalog-card catalog-card-cover" onClick={() => go(page)}>
      {url && <img src={url} alt="" loading="lazy" />}
      <strong>{title}</strong>
      <span>{desc}</span>
    </button>
  );
}

export function CatalogsHome() {
  return (
    <section className="section-container catalogs-home" aria-label="Catalogues">
      <span className="eyebrow">CATALOGUES</span>
      <h2>Nos catalogues</h2>
      <div className="catalog-cards">
        <CoverCard slot="cover_photo" page="photo" title="Photographie" desc="Séances studio et événements" />
        <CoverCard slot="cover_tableaux" page="tableaux" title="Tableaux muraux" desc="Formats bois, sur mesure" />
        <CoverCard slot="cover_chine" page="chine" title="Précommandes Chine" desc="Commande via le groupe WhatsApp" />
        <CoverCard slot="cover_design" page="design" title="Services infographie" desc="Logos, flyers, roll-up, data" />
      </div>
    </section>
  );
}

export default function CatalogPhoto() {
  const [settings, setSettings] = useState(null);
  const [links, setLinks] = useState({});
  const [mode, setMode] = useState(null);

  useEffect(() => {
    supabase.rpc("get_price_settings").then(({ data, error }) => {
      if (error) { notify(errMsg(error)); setSettings({}); return; }
      setSettings(data || {});
    });
    supabase.from("service_links").select("key, url").then(({ data }) => {
      setLinks(Object.fromEntries((data || []).map((r) => [r.key, r.url])));
    });
  }, []);

  if (!settings) return <section className="section-container"><p>Chargement du catalogue…</p></section>;

  return (
    <section className="section-container photo-catalog">
      <button type="button" className="text-button" onClick={() => (mode ? setMode(null) : go("home"))}>← Retour</button>
      <span className="eyebrow">PHOTOGRAPHIE</span>
      <h1>Réserver une séance photo</h1>
      {!mode && <PhotoGallery />}
      {!mode && (
        <div className="catalog-cards">
          <button type="button" className="catalog-card" onClick={() => setMode("studio")}><strong>Séance studio</strong><span>Calcul en direct, paiement en ligne</span></button>
          <button type="button" className="catalog-card" onClick={() => setMode("event")}><strong>Événementielle</strong><span>Mariage, anniversaire, événement : demande par WhatsApp</span></button>
        </div>
      )}
      {mode === "studio" && <StudioForm cfg={studioConfigFrom(settings)} />}
      {mode === "event" && <EventForm waUrl={links.whatsapp_event} />}
    </section>
  );
}

function StudioForm({ cfg }) {
  const [f, setF] = useState({ name: "", phone: "", date: "", location: "", sessionType: "studio",
    photos: String(cfg.minPhotos), makeup: "non", makeupPeople: "1", people: "2", outfits: "2", extraNote: false, accept: false });
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const quote = studioQuote({
    photos: Number(f.photos) || 0,
    makeupPeople: f.makeup === "oui" ? Number(f.makeupPeople) || 0 : 0,
    people: Number(f.people) || 0,
    outfits: Number(f.outfits) || 0,
  }, cfg);

  async function reserve(event) {
    event.preventDefault();
    if (f.name.trim().length < 2 || f.phone.trim().length < 5) { notify("Indique ton nom et ton téléphone."); return; }
    if (!f.date || f.location.trim().length < 3) { notify("Indique la date et le lieu de la séance."); return; }
    if (!f.accept) { notify("Accepte les conditions de réservation pour continuer."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_photo_order", {
      p_kind: "studio",
      p_payload: {
        name: f.name.trim(), phone: f.phone.trim(), session_date: f.date, location: f.location.trim(),
        session_type: f.sessionType, photos: Number(f.photos) || 0,
        makeup_people: f.makeup === "oui" ? Number(f.makeupPeople) || 0 : 0,
        people: Number(f.people) || 0, outfits: Number(f.outfits) || 0,
        extra_photos_note: f.extraNote, accepted: true,
      },
    });
    setBusy(false);
    if (error) { notify(errMsg(error)); return; }
    setOrder({ id: data.order_id, amount: data.amount });
  }

  if (order) return (
    <div className="account-content-card">
      <h3>Paiement de ta séance</h3>
      <PaymentFlow
        amount={order.amount}
        onSubmit={async ({ transactionId, proofUrl }) => {
          const { error } = await supabase.rpc("submit_photo_payment", { p_order: order.id, p_tx: transactionId, p_proof: proofUrl });
          if (error) throw error;
        }}
        onDone={() => notify("Paiement envoyé. L'équipe confirme ta séance.")}
        doneMessage="Paiement envoyé. L'équipe vérifie ton paiement : tu recevras la confirmation dans tes notifications."
      />
    </div>
  );

  return (
    <form className="account-content-card admin-form" onSubmit={reserve}>
      <h3>Formulaire studio</h3>
      <input value={f.name} onChange={set("name")} placeholder="Nom complet" required maxLength={120} />
      <input value={f.phone} onChange={set("phone")} placeholder="Téléphone" required maxLength={30} />
      <label>Date de la séance<input type="date" value={f.date} onChange={set("date")} required /></label>
      <input value={f.location} onChange={set("location")} placeholder="Lieu de la séance" required maxLength={160} />
      <select value={f.sessionType} onChange={set("sessionType")}>
        <option value="studio">Séance en studio</option>
        <option value="exterieur">Séance en extérieur</option>
      </select>
      <label>Nombre de photos souhaitées (minimum {cfg.minPhotos})
        <input type="number" min={cfg.minPhotos} value={f.photos} onChange={set("photos")} />
      </label>
      <label>Séance avec maquillage ?
        <select value={f.makeup} onChange={set("makeup")}><option value="non">Non</option><option value="oui">Oui</option></select>
      </label>
      {f.makeup === "oui" && (
        <label>Nombre de personnes à maquiller<input type="number" min="1" value={f.makeupPeople} onChange={set("makeupPeople")} /></label>
      )}
      <label>Nombre de personnes présentes à la séance<input type="number" min="1" value={f.people} onChange={set("people")} />
        <small>2 personnes incluses ; au-delà, {fmt(cfg.extraPerson)} par personne.</small>
      </label>
      <label>Nombre de tenues<input type="number" min="1" value={f.outfits} onChange={set("outfits")} />
        <small>2 tenues incluses ; au-delà, {fmt(cfg.extraOutfit)} par tenue.</small>
      </label>
      <label className="admin-check"><input type="checkbox" checked={f.extraNote} onChange={set("extraNote")} /> Je souhaite des photos supplémentaires hors sélection : {fmt(cfg.photoPrice)} la photo (à préciser à la séance).</label>

      <div className="quote-box" aria-live="polite">
        <strong>Estimation</strong>
        {quote.lines.map((l, i) => <div key={i} className="quote-line"><span>{l.label}</span><b>{fmt(l.amount)}</b></div>)}
        <div className="quote-total"><span>Total</span><b>{fmt(quote.total)}</b></div>
        {quote.minApplied && <small>Le minimum de {cfg.minPhotos} photos est appliqué.</small>}
      </div>

      <label className="admin-check"><input type="checkbox" checked={f.accept} onChange={set("accept")} required /> J'ai lu et j'accepte les conditions de réservation.</label>
      <button type="submit" className="button button-primary button-full" disabled={busy || !f.accept}>{busy ? "Envoi…" : "Oui, j'accepte, je paye"}</button>
      <small className="booking-note">Séance réservée après paiement confirmé. En cas de non-présentation, la moitié du montant de la prestation reste acquise.</small>
    </form>
  );
}

function EventForm({ waUrl }) {
  const [f, setF] = useState({ name: "", phone: "", eventType: "", location: "", budget: "", duration: "", date: "", details: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(event) {
    event.preventDefault();
    if (f.name.trim().length < 2 || f.phone.trim().length < 5 || f.eventType.trim().length < 2) { notify("Nom, téléphone et type d'événement sont obligatoires."); return; }
    setBusy(true);
    const { error } = await supabase.rpc("create_photo_order", { p_kind: "event", p_payload: { ...f } });
    setBusy(false);
    if (error) { notify(errMsg(error)); return; }
    if (!waUrl) { notify("Le contact WhatsApp n'est pas encore configuré. Demande enregistrée."); return; }
    const text = [
      "Demande de couverture événementielle",
      `Nom : ${f.name}`, `Téléphone : ${f.phone}`, `Type d'événement : ${f.eventType}`,
      `Lieu : ${f.location}`, `Budget : ${f.budget}`, `Durée : ${f.duration}`,
      f.date ? `Date : ${f.date}` : "", f.details ? `Détails : ${f.details}` : "",
      "(Demande non confirmée : à valider par l'équipe)",
    ].filter(Boolean).join("\n");
    window.open(`${waUrl}${waUrl.includes("?") ? "&" : "?"}text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form className="account-content-card admin-form" onSubmit={submit}>
      <h3>Couverture événementielle</h3>
      <p>Ta demande est envoyée à l'équipe. Elle n'est pas une réservation confirmée.</p>
      <input value={f.name} onChange={set("name")} placeholder="Nom complet" required maxLength={120} />
      <input value={f.phone} onChange={set("phone")} placeholder="Téléphone" required maxLength={30} />
      <input value={f.eventType} onChange={set("eventType")} placeholder="Type d'événement (mariage, anniversaire…)" required maxLength={120} />
      <input value={f.location} onChange={set("location")} placeholder="Lieu de l'événement" maxLength={160} />
      <input value={f.budget} onChange={set("budget")} placeholder="Budget" maxLength={60} />
      <input value={f.duration} onChange={set("duration")} placeholder="Durée de la couverture" maxLength={60} />
      <label>Date (facultatif)<input type="date" value={f.date} onChange={set("date")} /></label>
      <textarea rows={3} value={f.details} onChange={set("details")} placeholder="Précisions utiles" maxLength={800} />
      <button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? "Envoi…" : "Soumettre et ouvrir WhatsApp"}</button>
    </form>
  );
}

// Administration : tarifs photo et commandes
export function PhotoAdmin({ onNotify }) {
  const [rows, setRows] = useState([]);
  const [links, setLinks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newRow, setNewRow] = useState({ key: "", label: "", value: "" });

  async function load() {
    const p = await supabase.from("price_settings").select("*").order("group_name").order("key");
    if (p.error) onNotify?.(errMsg(p.error)); else setRows(p.data || []);
    const l = await supabase.from("service_links").select("*").order("key");
    if (!l.error) setLinks(l.data || []);
    const o = await supabase.rpc("admin_list_photo_orders");
    if (!o.error) setOrders(Array.isArray(o.data) ? o.data : []);
  }
  useEffect(() => { load(); }, []);

  async function saveRow(r) {
    const { error } = await supabase.from("price_settings").update({ value: Number(r.value), label: r.label, updated_at: new Date().toISOString() }).eq("key", r.key);
    if (error) onNotify?.(errMsg(error)); else { onNotify?.("Tarif enregistré."); load(); }
  }
  async function addRow(e) {
    e.preventDefault();
    const key = newRow.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!key || !newRow.label.trim() || newRow.value === "") { onNotify?.("Clé, libellé et valeur sont obligatoires."); return; }
    const { error } = await supabase.from("price_settings").insert({ key, label: newRow.label.trim(), value: Number(newRow.value), group_name: "photo" });
    if (error) onNotify?.(errMsg(error)); else { setNewRow({ key: "", label: "", value: "" }); load(); }
  }
  async function saveLink(l) {
    const { error } = await supabase.from("service_links").update({ url: (l.url || "").trim() || null, updated_at: new Date().toISOString() }).eq("key", l.key);
    if (error) onNotify?.(errMsg(error)); else onNotify?.("Lien enregistré.");
  }
  async function confirmOrder(id, ok) {
    const { error } = await supabase.rpc("admin_confirm_photo_order", { p_order: id, p_ok: ok });
    if (error) onNotify?.(errMsg(error)); else { onNotify?.(ok ? "Séance confirmée." : "Séance annulée."); load(); }
  }

  return (
    <>
      <div className="account-content-card">
        <h3>Tarifs photo</h3>
        {rows.map((r) => (
          <div key={r.key} className="admin-row">
            <div><strong>{r.label}</strong><small> · {r.key}</small></div>
            <div className="admin-row-actions">
              <input type="number" min="0" defaultValue={r.value} onBlur={(e) => { r.value = e.target.value; }} aria-label={r.label} />
              <button type="button" className="button button-primary" onClick={() => saveRow(r)}>Enregistrer</button>
            </div>
          </div>
        ))}
        <form className="admin-form" onSubmit={addRow}>
          <h3>Ajouter un tarif</h3>
          <input value={newRow.label} onChange={(e) => setNewRow({ ...newRow, label: e.target.value })} placeholder="Libellé (ex. Retouche avancée)" maxLength={120} />
          <input value={newRow.key} onChange={(e) => setNewRow({ ...newRow, key: e.target.value })} placeholder="Identifiant (ex. retouche_avancee)" maxLength={40} />
          <input type="number" min="0" value={newRow.value} onChange={(e) => setNewRow({ ...newRow, value: e.target.value })} placeholder="Montant (FCFA)" />
          <button type="submit" className="button button-outline">Ajouter</button>
        </form>
      </div>
      <div className="account-content-card">
        <h3>Liens WhatsApp</h3>
        {links.map((l) => (
          <div key={l.key} className="admin-form">
            <strong>{l.label}</strong>
            <input defaultValue={l.url || ""} onBlur={(e) => { l.url = e.target.value; }} placeholder="https://…" />
            <button type="button" className="button button-outline" onClick={() => saveLink(l)}>Enregistrer le lien</button>
          </div>
        ))}
      </div>
      <div className="account-content-card">
        <h3>Commandes photo</h3>
        {orders.length === 0 && <p>Aucune commande.</p>}
        {orders.map((o) => (
          <div key={o.id} className="admin-row">
            <div><strong>{o.name}</strong><p>{o.kind === "studio" ? "Studio" : "Événementiel"} · {o.status} · {fmt(o.amount)}</p>{o.transaction_id && <p>ID : {o.transaction_id}</p>}{o.proof_url && <a href={o.proof_url} target="_blank" rel="noopener noreferrer">Voir la preuve</a>}</div>
            {o.status === "pending" && (
              <div className="admin-row-actions">
                <button type="button" className="button button-primary" onClick={() => confirmOrder(o.id, true)}>Confirmer</button>
                <button type="button" className="button button-danger" onClick={() => confirmOrder(o.id, false)}>Annuler</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
