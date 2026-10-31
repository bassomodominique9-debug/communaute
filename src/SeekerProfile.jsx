import { useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import { SKILL_GROUPS, NIVEAUX, EXPERIENCES, NIVEAUX_LANGUE, DISPONIBILITES, CONTRATS, MOBILITES } from "./jobSkills";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 33 » dans Supabase." : e?.message || "Erreur");

async function uploadDoc(file, folder) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connecte-toi pour continuer.");
  if (!file) throw new Error("Ajoute ton CV (PDF ou Word).");
  if (file.size > 10 * 1024 * 1024) throw new Error("Fichier trop lourd (10 Mo maximum).");
  return uploadFile(user, file, folder);
}

// Fiche candidat vue par les employeurs : anonyme, lisible, avec les compétences en badges
export function SeekerCard({ s, onDeleted }) {
  const p = s.profile || {};
  const skills = Array.isArray(p.competences) ? p.competences : [];
  const langs = p.langues || {};
  const langText = [langs.fr && `Français : ${langs.fr}`, langs.en && `Anglais : ${langs.en}`, langs.autres].filter(Boolean).join(" · ");
  const rows = [
    ["Niveau d'études", p.niveau || "—"],
    ["Diplôme", p.diplome || s.diploma || "—"],
    ["Formation suivie", p.formation || "—"],
    ["Expérience", p.experience || "—"],
    ["Dernier poste", p.dernier_poste || s.last_job || "—"],
    ["Secteur", p.secteur || "—"],
    ["Langues", langText || "—"],
    ["Disponibilité", p.disponibilite || "—"],
    ["Contrat souhaité", p.contrat || "—"],
    ["Mobilité", p.mobilite || "—"],
    p.pretentions ? ["Prétentions", p.pretentions] : null,
  ].filter(Boolean);

  async function removeMine() {
    if (!window.confirm("Supprimer ton profil de recherche d'emploi ?")) return;
    const { error } = await supabase.rpc("delete_my_seeker_profile");
    if (error) { notify(errMsg(error)); return; }
    notify("Profil supprimé."); onDeleted?.();
  }

  return (
    <article className="account-content-card job-card seeker-card">
      <div className="job-head">
        <strong>Candidat</strong>
        <span className="job-badge job-unverified">{[s.sex, s.age ? `${s.age} ans` : null].filter(Boolean).join(" · ") || "Profil"}</span>
      </div>
      <small>{[s.city, s.country].filter(Boolean).join(", ") || "Localisation non précisée"}</small>
      {skills.length > 0 && (
        <div className="skill-chips">{skills.map((k) => <span key={k} className="skill-chip">{k}</span>)}</div>
      )}
      {p.autre_competence && <p><b>Autres compétences :</b> {p.autre_competence}</p>}
      <dl className="seeker-facts">
        {rows.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
      {p.motivation && <div className="seeker-block"><b>Présentation</b><p>{p.motivation}</p></div>}
      {p.realisations && <div className="seeker-block"><b>Réalisations</b><p>{p.realisations}</p></div>}
      {p.portfolio && <a className="top-learner-link" href={p.portfolio} target="_blank" rel="noopener noreferrer">Voir le portfolio</a>}
      {s.mine && <button type="button" className="button button-danger" onClick={removeMine}>Supprimer mon profil</button>}
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

const blank = {
  full_name: "", phone: "", age: "", sex: "", city: "", country: "",
  niveau: "", diplome: "", formation: "", experience: "", dernier_poste: "", secteur: "",
  fr: "", en: "", autres_langues: "", disponibilite: "", contrat: "", mobilite: "", pretentions: "",
  motivation: "", realisations: "", portfolio: "", autre_competence: "",
};

// Formulaire candidat : sections claires, compétences à cocher, présentation pour l'employeur
export function SeekerModal({ onClose }) {
  const [f, setF] = useState(blank);
  const [skills, setSkills] = useState([]);
  const [cv, setCv] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (item) => setSkills((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

  async function save(event) {
    event.preventDefault();
    if (skills.length === 0 && !f.autre_competence.trim()) { notify("Coche au moins une compétence."); return; }
    if (f.motivation.trim().length < 30) { notify("Présente-toi en quelques phrases (30 caractères minimum)."); return; }
    setBusy(true);
    try {
      const cvUrl = await uploadDoc(cv, "cv/");
      const photoUrl = photo ? await uploadDoc(photo, "photos/") : null;
      const profile = {
        niveau: f.niveau, diplome: f.diplome.trim(), formation: f.formation.trim(), experience: f.experience,
        dernier_poste: f.dernier_poste.trim(), secteur: f.secteur.trim(),
        langues: { fr: f.fr, en: f.en, autres: f.autres_langues.trim() },
        disponibilite: f.disponibilite, contrat: f.contrat, mobilite: f.mobilite, pretentions: f.pretentions.trim(),
        motivation: f.motivation.trim(), realisations: f.realisations.trim(), portfolio: f.portfolio.trim(),
        competences: skills, autre_competence: f.autre_competence.trim(),
      };
      const { error } = await supabase.rpc("submit_seeker_profile", {
        p_full_name: f.full_name, p_phone: f.phone, p_skills: skills.join(", ") + (f.autre_competence ? `, ${f.autre_competence}` : ""),
        p_diploma: f.diplome, p_age: f.age ? Number(f.age) : null, p_last_job: f.dernier_poste,
        p_city: f.city, p_country: f.country, p_sex: f.sex, p_cv: cvUrl, p_photo: photoUrl, p_profile: profile,
      });
      if (error) throw error;
      notify("Ton profil est enregistré. Il apparaît anonymement chez les employeurs.");
      onClose();
    } catch (err) { notify(errMsg(err)); }
    setBusy(false);
  }

  const select = (value, onChange, options, placeholder) => (
    <select value={value} onChange={onChange} required>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <Modal title="Mon profil candidat" onClose={onClose}>
      <form className="admin-form seeker-form" onSubmit={save}>
        <p className="seeker-intro">Tes coordonnées et ton CV ne sont envoyés qu'à l'équipe. Les employeurs voient seulement ton profil, sans ton nom.</p>

        <fieldset className="seeker-section">
          <legend>Identité</legend>
          <input value={f.full_name} onChange={set("full_name")} placeholder="Nom complet" required maxLength={120} />
          <input value={f.phone} onChange={set("phone")} placeholder="Téléphone" required maxLength={30} />
          <input type="number" min="14" max="90" value={f.age} onChange={set("age")} placeholder="Âge" />
          {select(f.sex, set("sex"), ["Femme", "Homme", "Autre"], "Sexe")}
          <input value={f.city} onChange={set("city")} placeholder="Ville" required maxLength={80} />
          <input value={f.country} onChange={set("country")} placeholder="Pays" required maxLength={80} />
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Formation</legend>
          {select(f.niveau, set("niveau"), NIVEAUX, "Niveau d'études")}
          <input value={f.diplome} onChange={set("diplome")} placeholder="Diplôme obtenu (ex. BEPC 2022)" maxLength={160} />
          <input value={f.formation} onChange={set("formation")} placeholder="Formation suivie (ex. ED B-ACADEMY, infographie)" maxLength={160} />
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Expérience</legend>
          {select(f.experience, set("experience"), EXPERIENCES, "Années d'expérience")}
          <input value={f.dernier_poste} onChange={set("dernier_poste")} placeholder="Dernier poste occupé" maxLength={200} />
          <input value={f.secteur} onChange={set("secteur")} placeholder="Secteur (ex. commerce, communication, santé)" maxLength={120} />
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Langues</legend>
          <label>Français<select value={f.fr} onChange={set("fr")}><option value="">Niveau</option>{NIVEAUX_LANGUE.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>Anglais<select value={f.en} onChange={set("en")}><option value="">Niveau</option>{NIVEAUX_LANGUE.map((o) => <option key={o}>{o}</option>)}</select></label>
          <input value={f.autres_langues} onChange={set("autres_langues")} placeholder="Autres langues (ex. Pidgin, Chinois notions)" maxLength={120} />
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Disponibilité et recherche</legend>
          {select(f.disponibilite, set("disponibilite"), DISPONIBILITES, "Disponibilité")}
          {select(f.contrat, set("contrat"), CONTRATS, "Type de contrat recherché")}
          {select(f.mobilite, set("mobilite"), MOBILITES, "Mobilité")}
          <input value={f.pretentions} onChange={set("pretentions")} placeholder="Prétentions salariales (facultatif, ex. 150 000 FCFA)" maxLength={80} />
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Compétences (coche ce qui te correspond)</legend>
          {SKILL_GROUPS.map((g) => (
            <div key={g.title} className="skill-group">
              <strong>{g.title}</strong>
              <div className="skill-options">
                {g.items.map((item) => (
                  <label key={item} className={skills.includes(item) ? "skill-option skill-option-on" : "skill-option"}>
                    <input type="checkbox" checked={skills.includes(item)} onChange={() => toggle(item)} />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <input value={f.autre_competence} onChange={set("autre_competence")} placeholder="Autre compétence non listée" maxLength={120} />
          <small>{skills.length} compétence(s) cochée(s)</small>
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Présentation</legend>
          <textarea rows={4} value={f.motivation} onChange={set("motivation")} placeholder="Présente-toi : ce que tu sais faire, ce qui te motive, ce que tu apportes à une entreprise (30 caractères minimum)" maxLength={800} required />
          <textarea rows={3} value={f.realisations} onChange={set("realisations")} placeholder="Réalisations concrètes (projets, travaux, clients, résultats)" maxLength={800} />
          <input type="url" value={f.portfolio} onChange={set("portfolio")} placeholder="Lien vers un portfolio ou des travaux (facultatif, https://…)" />
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Documents</legend>
          <label>CV (obligatoire)<input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] || null)} required /></label>
          <label>Photo (facultative)<input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></label>
        </fieldset>

        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Envoi…" : "Envoyer mon profil"}</button>
      </form>
    </Modal>
  );
}
