import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import { DOMAINES } from "./jobSkills";
import "./catalogue-entreprises.css";
import CataloguePublications from "./CataloguePublications";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 42 » dans Supabase." : e?.message || "Erreur");

export function CompanyList({ onOpen }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    supabase.rpc("list_public_catalogues").then(({ data, error }) => setItems(error ? [] : (Array.isArray(data) ? data : [])));
  }, []);
  if (items === null) return <p className="ce-note">Chargement…</p>;
  if (items.length === 0) return <p className="ce-note">Les premiers catalogues d'entreprises arrivent bientôt.</p>;
  return (
    <div className="ce-grid">
      {items.map((c) => (
        <button key={c.id} type="button" className="ce-card ce-cube" onClick={() => onOpen(c)}>
          <div className="ce-cube-photo"><img src={c.photo_url} alt="" loading="lazy" />{(c.avatar_url || c.logo_url) && <img className="ce-avatar" src={c.avatar_url || c.logo_url} alt="" />}</div>
          <div className="ce-cube-info">
            <strong>{c.name}</strong>
            <small className="ce-cube-domaine">{c.domaine}</small>
            <small className="ce-cube-desc">{c.short || c.description}</small>
            <Stars value={c.stars || 0} />
          </div>
        </button>
      ))}
    </div>
  );
}

export function Stars({ value }) {
  return (
    <div className="ce-stars" aria-label={`${value} étoile(s) sur 6`}>
      {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i < value ? "on" : ""}>★</span>)}
    </div>
  );
}

export function CompanyDetail({ company, onBack }) {
  const digits = String(company.whatsapp || "").replace(/\D/g, "");
  const [pubs, setPubs] = useState(null);
  useEffect(() => {
    supabase.rpc("list_catalogue_publications", { p_id: company.id }).then(({ data, error }) => setPubs(error ? [] : (Array.isArray(data) ? data : [])));
  }, [company.id]);
  async function order(text) {
    await supabase.rpc("order_catalogue", { p_id: company.id });
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent("Bonjour, je souhaite commander : " + text)}`, "_blank", "noopener,noreferrer");
  }
  async function report() {
    const { error } = await supabase.rpc("report_catalogue", { p_id: company.id });
    if (error) notify(errMsg(error)); else notify("Merci. Ton signalement a été enregistré.");
  }
  return (
    <section className="ce-detail">
      <header className="ce-head">
        <button type="button" className="ce-back" aria-label="Retour" onClick={onBack}>‹</button>
        {(company.avatar_url || company.logo_url) && <img className="ce-head-avatar" src={company.avatar_url || company.logo_url} alt="" />}
        <strong>{company.name}</strong>
      </header>
      <img className="ce-hero" src={company.photo_url} alt="" />
      <small className="ce-cube-domaine">{company.domaine}</small>
      <p className="ce-desc">{company.description}</p>
      <Stars value={company.stars || 0} />
      <h4 className="ce-sub">Publications</h4>
      {pubs === null && <p className="ce-note">Chargement…</p>}
      {pubs && pubs.length === 0 && <p className="ce-note">Aucune publication pour le moment.</p>}
      <div className="ce-feed">
        {(pubs || []).map((p) => (
          <article key={p.id} className="ce-pub">
            {p.photo_url && <img src={p.photo_url} alt="" loading="lazy" />}
            {p.body && <p>{p.body}</p>}
            <button type="button" className="ce-order" onClick={() => order(p.body || company.name)}>Commander</button>
          </article>
        ))}
      </div>
      <button type="button" className="ce-report" onClick={report}>Signaler ce catalogue</button>
    </section>
  );
}

export function CatalogueCreate({ onBack, onDone }) {
  const [f, setF] = useState({ name: "", domaine: "", description: "", whatsapp: "", city: "", address: "" });
  const [files, setFiles] = useState({ photo: null, logo: null, flyer: null });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    if (!files.photo || !files.logo) { notify("Ajoute la photo et le logo de l'entreprise."); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const photo = await uploadFile(user, files.photo, "entreprises/");
      const logo = await uploadFile(user, files.logo, "entreprises/");
      const flyer = files.flyer ? await uploadFile(user, files.flyer, "entreprises/") : null;
      const { error } = await supabase.rpc("create_catalogue", { p_name: f.name, p_domaine: f.domaine, p_description: f.description, p_photo: photo, p_logo: logo, p_flyer: flyer, p_whatsapp: f.whatsapp, p_city: f.city, p_address: f.address });
      if (error) throw error;
      notify("Catalogue envoyé. Il sera publié après validation.");
      onDone();
    } catch (err) { notify(errMsg(err)); }
    setBusy(false);
  }
  return (
    <section className="ce-form-wrap">
      <header className="ce-head"><button type="button" className="ce-back" aria-label="Retour" onClick={onBack}>‹</button><strong>Créer mon catalogue</strong></header>
      <form className="ce-form" onSubmit={submit}>
        <input value={f.name} onChange={set("name")} placeholder="Nom de l'entreprise" required maxLength={120} />
        <select value={f.domaine} onChange={set("domaine")} required>
          <option value="">Domaine d'activité</option>
          {DOMAINES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <textarea rows={4} value={f.description} onChange={set("description")} placeholder="Décris tes prestations" maxLength={1500} />
        <input value={f.whatsapp} onChange={set("whatsapp")} placeholder="Numéro WhatsApp avec indicatif (ex. 237 6xx xxx xxx)" required />
        <input value={f.city} onChange={set("city")} placeholder="Ville et quartier" required maxLength={120} />
        <input value={f.address} onChange={set("address")} placeholder="Adresse de l'entreprise" maxLength={200} />
        <label>Photo de l'entreprise (téléphone)<input type="file" accept="image/*" required onChange={(e) => setFiles({ ...files, photo: e.target.files?.[0] || null })} /></label>
        <label>Logo<input type="file" accept="image/*" required onChange={(e) => setFiles({ ...files, logo: e.target.files?.[0] || null })} /></label>
        <label>Flyer (facultatif)<input type="file" accept="image/*" onChange={(e) => setFiles({ ...files, flyer: e.target.files?.[0] || null })} /></label>
        <button type="submit" className="ce-submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer pour validation"}</button>
      </form>
    </section>
  );
}

const PRIX = { particulier: { par: 5000, min: 1, label: "Particulier : 5 000 FCFA par mois" }, grande: { par: 12500, min: 2, label: "Grande entreprise : 25 000 FCFA pour 2 mois" } };

export function SubscriptionForm({ onDone }) {
  const [type, setType] = useState("particulier");
  const [months, setMonths] = useState(1);
  const [tx, setTx] = useState("");
  const [proof, setProof] = useState(null);
  const [busy, setBusy] = useState(false);
  const info = PRIX[type];
  const total = info.par * Math.max(months, info.min);
  async function pay(e) {
    e.preventDefault();
    if (!proof) { notify("Ajoute la photo de la transaction."); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = await uploadFile(user, proof, "paiements-catalogues/");
      const { error } = await supabase.rpc("submit_catalogue_payment", { p_type: type, p_months: Math.max(months, info.min), p_tx: tx, p_proof: url });
      if (error) throw error;
      notify("Paiement envoyé. Ton catalogue sera réactivé après confirmation.");
      onDone();
    } catch (err) { notify(errMsg(err)); }
    setBusy(false);
  }
  return (
    <form className="ce-form ce-pay" onSubmit={pay}>
      <strong>Régler ma facture</strong>
      <select value={type} onChange={(e) => { setType(e.target.value); setMonths(PRIX[e.target.value].min); }}>
        <option value="particulier">Particulier (5 000 FCFA par mois)</option>
        <option value="grande">Grande entreprise (25 000 FCFA pour 2 mois)</option>
      </select>
      <label>Nombre de mois<input type="number" min={info.min} value={months} onChange={(e) => setMonths(Number(e.target.value))} /></label>
      <div className="ce-total">Total à payer : <b>{total.toLocaleString("fr-FR")} FCFA</b></div>
      <input value={tx} onChange={(e) => setTx(e.target.value)} placeholder="ID de la transaction" required />
      <label>Photo de la transaction<input type="file" accept="image/*" required onChange={(e) => setProof(e.target.files?.[0] || null)} /></label>
      <button type="submit" className="ce-submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer le paiement"}</button>
    </form>
  );
}

export function MyCatalogue({ onBack }) {
  const [cat, setCat] = useState(undefined);
  const [p, setP] = useState({ title: "", description: "", file: null });
  async function load() { const { data, error } = await supabase.rpc("my_catalogue"); setCat(error ? null : data); }
  useEffect(() => { load(); }, []);
  async function addPrest(e) {
    e.preventDefault();
    try {
      let photo = null;
      if (p.file) { const { data: { user } } = await supabase.auth.getUser(); photo = await uploadFile(user, p.file, "prestations/"); }
      const { error } = await supabase.rpc("my_add_prestation", { p_title: p.title, p_description: p.description, p_photo: photo });
      if (error) throw error;
      setP({ title: "", description: "", file: null }); load();
    } catch (err) { notify(errMsg(err)); }
  }
  async function delPrest(id) {
    if (!window.confirm("Supprimer cette prestation ?")) return;
    const { error } = await supabase.rpc("my_delete_prestation", { p_id: id });
    if (error) notify(errMsg(error)); else load();
  }
  if (cat === undefined) return <p className="ce-note">Chargement…</p>;
  if (!cat) return (<section className="ce-form-wrap"><header className="ce-head"><button type="button" className="ce-back" aria-label="Retour" onClick={onBack}>‹</button><strong>Mon catalogue</strong></header><p className="ce-note">Tu n'as pas encore de catalogue.</p></section>);
  const label = { en_attente: "En attente de validation", publie: "Publié", ferme: "Fermé", refuse: "Non retenu" }[cat.status];
  return (
    <section className="ce-form-wrap">
      <header className="ce-head"><button type="button" className="ce-back" aria-label="Retour" onClick={onBack}>‹</button><strong>{cat.name}</strong></header>
      <span className={`ce-status ce-status-${cat.status}`}>{label}</span>
      {!cat.active && <p className="ce-note">Ton abonnement n'est pas actif : ton catalogue n'est pas visible.</p>}
      {cat.active && <p className="ce-note">Abonnement actif jusqu'au {new Date(cat.paid_until).toLocaleDateString("fr-FR")}.</p>}
      {!cat.active && <SubscriptionForm onDone={load} />}
      {cat.status === "ferme" && <a className="ce-contact" href="https://wa.me/237653993968?text=" target="_blank" rel="noopener noreferrer">Nous contacter : mon catalogue a été fermé</a>}
      <h4 className="ce-sub">Mes prestations</h4>
      {(cat.prestations || []).map((x) => (
        <article key={x.id} className="ce-prest"><div><strong>{x.title}</strong><small>{x.description}</small></div><button type="button" className="ce-del" onClick={() => delPrest(x.id)}>Supprimer</button></article>
      ))}
      <CataloguePublications />
      <form className="ce-form" onSubmit={addPrest}>
        <input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} placeholder="Titre de la prestation" required maxLength={120} />
        <textarea rows={3} value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} placeholder="Description" maxLength={800} />
        <label>Photo (facultative)<input type="file" accept="image/*" onChange={(e) => setP({ ...p, file: e.target.files?.[0] || null })} /></label>
        <button type="submit" className="ce-submit">Ajouter la prestation</button>
      </form>
    </section>
  );
}
