import { useCallback, useEffect, useState } from "react";
import "./community-lot1.css";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import PaymentFlow from "./PaymentFlow";
import { SeekerCard, SeekerModal } from "./SeekerProfile";
import { EmployerForm } from "./EmployerProfile";
import "./lot8.css";

const notify = (message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }));
const go = (page) => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page }));
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 24 » dans Supabase." : e?.message || "Erreur");

async function uploadDoc(file, folder) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour continuer.");
  if (!file) throw new Error("Ajoute ton CV (PDF ou Word).");
  if (file.size > 10 * 1024 * 1024) throw new Error("Fichier trop lourd (10 Mo maximum).");
  return uploadFile(user, file, folder);
}

export function JobsHome() {
  const [offers, setOffers] = useState([]);
  const [modal, setModal] = useState(null);
  useEffect(() => {
    supabase.rpc("list_published_offers").then(({ data, error }) => { if (!error && Array.isArray(data)) setOffers(data.slice(0, 3)); });
  }, []);
  return (
    <section className="section-container jobs-home" aria-label="Offres d'emploi">
      <span className="eyebrow">OFFRE D'EMPLOI</span>
      <h2>Trouve ou propose un emploi</h2>
      <div className="jobs-home-buttons">
        <button type="button" className="button button-primary" onClick={() => setModal("recruiter")}>Recruteurs</button>
        <button type="button" className="button button-outline" onClick={() => setModal("seeker")}>Recherche d'emploi</button>
      </div>
      {offers.length === 0 && <p className="jobs-empty">Les offres validées par l'équipe apparaîtront ici.</p>}
      {offers.map((o) => <OfferCard key={o.id} offer={o} compact />)}
      {offers.length > 0 && <button type="button" className="text-button" onClick={() => go("jobs")}>Voir toutes les offres et candidats →</button>}
      {modal === "recruiter" && <RecruiterModal onClose={() => setModal(null)} />}
      {modal === "seeker" && <SeekerModal onClose={() => setModal(null)} />}
    </section>
  );
}

export function JobsPage() {
  const [tab, setTab] = useState("offers");
  const [offers, setOffers] = useState([]);
  const [seekers, setSeekers] = useState([]);
  const [applying, setApplying] = useState(null);
  const [modal, setModal] = useState(null);
  useEffect(() => {
    supabase.rpc("list_published_offers").then(({ data }) => setOffers(Array.isArray(data) ? data : []));
    supabase.rpc("list_public_seekers").then(({ data }) => setSeekers(Array.isArray(data) ? data : []));
  }, []);
  return (
    <section className="section-container jobs-page">
      <span className="eyebrow">JOBS</span>
      <div className="community-warning">⚠ Aucune entreprise ne vous demandera de l'argent pour un travail. Soyez vigilants : signalez-nous tout doute.</div>
      <h1>Emplois</h1>
      <div className="jobs-home-buttons">
        <button type="button" className="button button-primary" onClick={() => setModal("recruiter")}>Publier une offre</button>
        <button type="button" className="button button-outline" onClick={() => setModal("seeker")}>Je cherche un emploi</button>
      </div>
      <nav className="pq-tabs">
        <button type="button" className={tab === "offers" ? "pq-tab pq-tab-on" : "pq-tab"} onClick={() => setTab("offers")}>Offres ({offers.length})</button>
        <button type="button" className={tab === "seekers" ? "pq-tab pq-tab-on" : "pq-tab"} onClick={() => setTab("seekers")}>Candidats ({seekers.length})</button>
      </nav>
      {tab === "offers" && offers.map((o) => <OfferCard key={o.id} offer={o} onApply={() => setApplying(o)} onDeleted={(id) => setOffers((prev) => prev.filter((x) => x.id !== id))} />)}
      {tab === "offers" && offers.length === 0 && <p>Aucune offre publiée pour le moment.</p>}
      {tab === "seekers" && seekers.map((s) => <SeekerCard key={s.id} s={s} onDeleted={() => setSeekers((prev) => prev.filter((x) => x.id !== s.id))} />)}
      {tab === "seekers" && seekers.length === 0 && <p>Aucun profil publié pour le moment.</p>}
      {applying && <ApplyModal offer={applying} onClose={() => setApplying(null)} />}
      {modal === "recruiter" && <RecruiterModal onClose={() => setModal(null)} />}
      {modal === "seeker" && <SeekerModal onClose={() => setModal(null)} />}
    </section>
  );
}

function OfferCard({ offer, compact, onApply, onDeleted }) {
  const [asking, setAsking] = useState(false);
  async function removeMine() {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    const { error } = await supabase.rpc("delete_my_job_offer", { p_offer: offer.id });
    if (error) { notify(errMsg(error)); return; }
    notify("Annonce supprimée."); onDeleted?.(offer.id);
  }
  const [text, setText] = useState("");
  async function contact() {
    if (text.trim().length < 2) return;
    const { error } = await supabase.rpc("contact_job_poster", { p_offer: offer.id, p_text: text.trim() });
    if (error) { notify(errMsg(error)); return; }
    setText(""); setAsking(false); notify("Ton message a été envoyé à l'employeur.");
  }
  return (
    <article className="account-content-card job-card" data-focus={`job:${offer.id}`}>
      <div className="job-head">
        <strong>{offer.title}</strong>
        <span className={offer.verified ? "job-badge job-verified" : "job-badge job-unverified"}>{offer.verified ? "✓ Vérifié" : "Non vérifié"}</span>
      </div>
      <small>{offer.company_name}{offer.location ? ` · ${offer.location}` : ""}{offer.salary_text ? ` · ${offer.salary_text}` : ""}</small>
      {!compact && offer.profile && offer.profile.domains && (
        <div className="skill-chips">{offer.profile.domains.map((d) => <span key={d} className="skill-chip">{d}</span>)}</div>
      )}
      {!compact && offer.profile && offer.profile.skills && (
        <div className="skill-chips">{offer.profile.skills.map((k) => <span key={k} className="skill-chip skill-chip-soft">{k}</span>)}</div>
      )}
      {!compact && offer.profile && (
        <dl className="seeker-facts">
          {[
            ["Type d'entreprise", offer.profile.company_type],
            ["Lieu", [offer.profile.city, offer.profile.country].filter(Boolean).join(", ")],
            ["Modalité", offer.profile.modality],
            ["Contrat", offer.profile.contract],
            ["Niveau requis", offer.profile.niveau],
            ["Expérience", offer.profile.experience],
            ["Langues", [offer.profile.langues?.fr && `Français ${offer.profile.langues.fr}`, offer.profile.langues?.en && `Anglais ${offer.profile.langues.en}`].filter(Boolean).join(" · ")],
            ["Postes", offer.profile.positions],
            ["Début", offer.profile.start],
          ].filter(([, v]) => v && v !== "").map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      )}
      {!compact && offer.profile && offer.profile.presentation && (
        <div className="seeker-block"><b>Présentation de l'entreprise</b><p>{offer.profile.presentation}</p></div>
      )}
      {!compact && offer.profile && offer.profile.website && (
        <a className="top-learner-link" href={offer.profile.website} target="_blank" rel="noopener noreferrer">Voir le site de l'entreprise</a>
      )}
      {!compact && offer.requirements && <p><b>Critères requis :</b> {offer.requirements}</p>}
      {!compact && offer.shared_info && <p>{offer.shared_info}</p>}
      {!compact && (
        <div className="job-actions">
          {onApply && <button type="button" className="button button-primary" onClick={onApply}>Postuler</button>}
          <button type="button" className="button button-outline" onClick={() => setAsking(!asking)}>Contacter l'employeur</button>
          {offer.mine && <button type="button" className="button button-danger" onClick={removeMine}>Supprimer mon annonce</button>}
        </div>
      )}
      {asking && (
        <div className="top-learner-form">
          <textarea rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ta question pour l'employeur" />
          <button type="button" className="button button-primary" onClick={contact}>Envoyer</button>
        </div>
      )}
    </article>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="auth-modal job-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function RecruiterModal({ onClose }) {
  return <EmployerForm onClose={onClose} />;
}

function ApplyModal({ offer, onClose }) {
  const [f, setF] = useState({ full_name: "", phone: "", message: "" });
  const [cv, setCv] = useState(null);
  const [busy, setBusy] = useState(false);
  async function send(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const cvUrl = await uploadDoc(cv, "candidatures/");
      const { error } = await supabase.rpc("apply_job", { p_offer: offer.id, p_full_name: f.full_name, p_phone: f.phone, p_message: f.message, p_cv: cvUrl });
      if (error) throw error;
      notify("Candidature envoyée. L'employeur et l'administrateur la reçoivent avec ton CV.");
      onClose();
    } catch (err) { notify(errMsg(err)); }
    setBusy(false);
  }
  return (
    <Modal title={`Postuler : ${offer.title}`} onClose={onClose}>
      <form className="admin-form" onSubmit={send}>
        <input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder="Nom complet" required maxLength={120} />
        <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Téléphone" required maxLength={30} />
        <textarea rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Tes réponses aux critères requis" maxLength={1000} />
        <label>CV (obligatoire)<input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] || null)} required /></label>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Envoi…" : "Postuler"}</button>
      </form>
    </Modal>
  );
}
