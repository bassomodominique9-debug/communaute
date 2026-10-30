import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import PaymentFlow from "./PaymentFlow";
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
    <article className="account-content-card job-card">
      <div className="job-head">
        <strong>{offer.title}</strong>
        <span className={offer.verified ? "job-badge job-verified" : "job-badge job-unverified"}>{offer.verified ? "✓ Vérifié" : "Non vérifié"}</span>
      </div>
      <small>{offer.company_name}{offer.location ? ` · ${offer.location}` : ""}{offer.salary_text ? ` · ${offer.salary_text}` : ""}</small>
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

function SeekerCard({ s, onDeleted }) {
  async function removeMine() {
    if (!window.confirm("Supprimer ton profil de recherche d'emploi ?")) return;
    const { error } = await supabase.rpc("delete_my_seeker_profile");
    if (error) { notify(errMsg(error)); return; }
    notify("Profil supprimé."); onDeleted?.();
  }
  return (
    <article className="account-content-card job-card">
      <strong>Candidat anonyme</strong>
      {s.mine && <button type="button" className="button button-danger" onClick={removeMine}>Supprimer mon profil</button>}
      <small>{[s.sex, s.age ? `${s.age} ans` : "", s.city, s.country].filter(Boolean).join(" · ")}</small>
      <p><b>Compétences :</b> {s.skills || "—"}</p>
      <p><b>Diplôme :</b> {s.diploma || "—"}</p>
      <p><b>Dernier emploi :</b> {s.last_job || "—"}</p>
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
  const blank = { company: "", contact: "", title: "", location: "", salary: "", requirements: "", shared: "" };
  const [f, setF] = useState(blank);
  const [offerId, setOfferId] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function create(event) {
    event.preventDefault();
    if (!f.requirements.trim()) { notify("Indique les critères requis pour postuler."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_job_offer", {
      p_company: f.company, p_contact: f.contact, p_title: f.title, p_location: f.location,
      p_salary: f.salary, p_requirements: f.requirements, p_shared: f.shared,
    });
    setBusy(false);
    if (error) { notify(errMsg(error)); return; }
    setOfferId(data?.offer_id);
  }

  if (offerId) return (
    <Modal title="Paiement de l'annonce" onClose={onClose}>
      <PaymentFlow
        amount={2500}
        onSubmit={async ({ transactionId, proofUrl }) => {
          const { error } = await supabase.rpc("submit_job_payment", { p_offer: offerId, p_tx: transactionId, p_proof: proofUrl });
          if (error) throw error;
        }}
        onDone={() => notify("Paiement envoyé. L'administrateur confirme, puis l'offre est publiée.")}
        doneMessage="Paiement envoyé. L'administrateur confirme le paiement et publie ton offre. Tu seras prévenu dans tes notifications."
      />
    </Modal>
  );

  return (
    <Modal title="Publier une offre d'emploi" onClose={onClose}>
      <form className="admin-form" onSubmit={create}>
        <p>Après remplissage, l'annonce est payée (2 500 FCFA) puis validée par l'administrateur.</p>
        <input value={f.company} onChange={set("company")} placeholder="Nom de l'entreprise" required maxLength={120} />
        <input value={f.contact} onChange={set("contact")} placeholder="Personne à contacter" maxLength={120} />
        <input value={f.title} onChange={set("title")} placeholder="Intitulé du poste" required maxLength={160} />
        <input value={f.location} onChange={set("location")} placeholder="Lieu (ville, quartier)" maxLength={160} />
        <input value={f.salary} onChange={set("salary")} placeholder="Salaire (ex. 150 000 FCFA / mois)" maxLength={120} />
        <textarea rows={3} value={f.requirements} onChange={set("requirements")} placeholder="Critères requis pour postuler" required maxLength={3000} />
        <textarea rows={3} value={f.shared} onChange={set("shared")} placeholder="Ce que l'employeur partage (missions, avantages, modalités)" maxLength={3000} />
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Enregistrement…" : "Continuer vers le paiement"}</button>
      </form>
    </Modal>
  );
}

function SeekerModal({ onClose }) {
  const blank = { full_name: "", phone: "", skills: "", diploma: "", age: "", last_job: "", city: "", country: "", sex: "" };
  const [f, setF] = useState(blank);
  const [cv, setCv] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const cvUrl = await uploadDoc(cv, "cv/");
      const photoUrl = photo ? await uploadDoc(photo, "photos/") : null;
      const { error } = await supabase.rpc("submit_seeker_profile", {
        p_full_name: f.full_name, p_phone: f.phone, p_skills: f.skills, p_diploma: f.diploma,
        p_age: f.age ? Number(f.age) : null, p_last_job: f.last_job, p_city: f.city, p_country: f.country,
        p_sex: f.sex, p_cv: cvUrl, p_photo: photoUrl,
      });
      if (error) throw error;
      notify("Ton profil est enregistré. Il apparaît anonymement dans la liste des candidats.");
      onClose();
    } catch (err) { notify(errMsg(err)); }
    setBusy(false);
  }

  return (
    <Modal title="Recherche d'emploi" onClose={onClose}>
      <form className="admin-form" onSubmit={save}>
        <p>Ton nom, ton téléphone et ton CV sont envoyés uniquement à l'administrateur. Ton profil public reste anonyme.</p>
        <input value={f.full_name} onChange={set("full_name")} placeholder="Nom complet" required maxLength={120} />
        <input value={f.phone} onChange={set("phone")} placeholder="Téléphone" required maxLength={30} />
        <input value={f.skills} onChange={set("skills")} placeholder="Compétences" maxLength={500} />
        <input value={f.diploma} onChange={set("diploma")} placeholder="Diplôme" maxLength={160} />
        <input type="number" min="14" max="90" value={f.age} onChange={set("age")} placeholder="Âge" />
        <input value={f.last_job} onChange={set("last_job")} placeholder="Dernier emploi" maxLength={200} />
        <input value={f.city} onChange={set("city")} placeholder="Ville" maxLength={80} />
        <input value={f.country} onChange={set("country")} placeholder="Pays" maxLength={80} />
        <select value={f.sex} onChange={set("sex")}><option value="">Sexe</option><option>Femme</option><option>Homme</option><option>Autre</option></select>
        <label>CV (obligatoire)<input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] || null)} required /></label>
        <label>Photo (facultative)<input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></label>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Envoi…" : "Envoyer mon profil"}</button>
      </form>
    </Modal>
  );
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
