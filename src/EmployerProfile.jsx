import { useState } from "react";
import { supabase } from "./supabaseClient";
import PaymentFlow from "./PaymentFlow";
import { SKILL_GROUPS, NIVEAUX, EXPERIENCES, NIVEAUX_LANGUE, CONTRATS, DOMAINES, SECTEURS, TYPES_ENTREPRISE, MODALITES, DEBUTS } from "./jobSkills";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 35 » dans Supabase." : e?.message || "Erreur");

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
  company: "", contact: "", sector: "", company_type: "", city: "", country: "", website: "", presentation: "",
  title: "", location: "", modality: "", contract: "", niveau: "", experience: "", fr: "", en: "",
  positions: "1", start: "", salary: "", missions: "", benefits: "",
};

// Formulaire employeur : surtout des choix, quelques phrases pour présenter l'entreprise et le poste
export function EmployerForm({ onClose }) {
  const [f, setF] = useState(blank);
  const [domains, setDomains] = useState([]);
  const [skills, setSkills] = useState([]);
  const [offerId, setOfferId] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (list, setList) => (item) => setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const toggleDomain = toggle(domains, setDomains);
  const toggleSkill = toggle(skills, setSkills);

  async function create(event) {
    event.preventDefault();
    if (domains.length === 0) { notify("Coche au moins un domaine d'activité."); return; }
    if (skills.length === 0) { notify("Coche au moins une compétence recherchée."); return; }
    if (f.presentation.trim().length < 40) { notify("Présente ton entreprise (40 caractères minimum)."); return; }
    if (f.missions.trim().length < 30) { notify("Décris les missions (30 caractères minimum)."); return; }
    const profile = {
      presentation: f.presentation.trim(), sector: f.sector, company_type: f.company_type,
      city: f.city.trim(), country: f.country.trim(), website: f.website.trim(),
      domains, skills, niveau: f.niveau, experience: f.experience,
      langues: { fr: f.fr, en: f.en }, contract: f.contract, modality: f.modality,
      positions: Number(f.positions) || 1, start: f.start, missions: f.missions.trim(), benefits: f.benefits.trim(),
    };
    setBusy(true);
    const { data, error } = await supabase.rpc("create_job_offer", {
      p_company: f.company, p_contact: f.contact, p_title: f.title || domains[0], p_location: f.location || f.city,
      p_salary: f.salary,
      p_requirements: [f.niveau && `Niveau : ${f.niveau}`, f.experience && `Expérience : ${f.experience}`, skills.length && `Compétences : ${skills.join(", ")}`].filter(Boolean).join("\n"),
      p_shared: [f.missions.trim(), f.benefits.trim() && `Avantages : ${f.benefits.trim()}`].filter(Boolean).join("\n\n"),
      p_profile: profile,
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

  const sel = (value, key, options, placeholder) => (
    <select value={value} onChange={set(key)} required>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <Modal title="Publier une offre" onClose={onClose}>
      <form className="admin-form employer-form" onSubmit={create}>
        <p className="seeker-intro">Coche et choisis ce qui correspond. Le paiement de 2 500 FCFA se fait ensuite, pour publier l'offre.</p>

        <fieldset className="seeker-section">
          <legend>Entreprise</legend>
          <input value={f.company} onChange={set("company")} placeholder="Nom de l'entreprise" required maxLength={120} />
          <input value={f.contact} onChange={set("contact")} placeholder="Personne à contacter" maxLength={120} />
          {sel(f.sector, "sector", SECTEURS, "Secteur")}
          {sel(f.company_type, "company_type", TYPES_ENTREPRISE, "Type d'entreprise")}
          <input value={f.city} onChange={set("city")} placeholder="Ville du siège" required maxLength={80} />
          <input value={f.country} onChange={set("country")} placeholder="Pays" required maxLength={80} />
          <input type="url" value={f.website} onChange={set("website")} placeholder="Site ou page en ligne (facultatif, https://…)" />
          <textarea rows={3} value={f.presentation} onChange={set("presentation")} placeholder="Présente ton entreprise en quelques phrases (40 caractères minimum)" required maxLength={800} />
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Domaines d'activité du poste</legend>
          <div className="skill-options">
            {DOMAINES.map((d) => (
              <label key={d} className={domains.includes(d) ? "skill-option skill-option-on" : "skill-option"}>
                <input type="checkbox" checked={domains.includes(d)} onChange={() => toggleDomain(d)} />{d}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Compétences recherchées</legend>
          {SKILL_GROUPS.map((g) => (
            <div key={g.title} className="skill-group">
              <strong>{g.title}</strong>
              <div className="skill-options">
                {g.items.map((item) => (
                  <label key={item} className={skills.includes(item) ? "skill-option skill-option-on" : "skill-option"}>
                    <input type="checkbox" checked={skills.includes(item)} onChange={() => toggleSkill(item)} />{item}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <small>{skills.length} compétence(s) cochée(s)</small>
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Le poste</legend>
          <input value={f.title} onChange={set("title")} placeholder="Intitulé du poste (ex. Assistant infographiste)" maxLength={160} />
          {sel(f.niveau, "niveau", NIVEAUX, "Niveau d'études minimum")}
          {sel(f.experience, "experience", EXPERIENCES, "Expérience souhaitée")}
          <label>Français requis<select value={f.fr} onChange={set("fr")}><option value="">Non précisé</option>{NIVEAUX_LANGUE.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>Anglais requis<select value={f.en} onChange={set("en")}><option value="">Non précisé</option>{NIVEAUX_LANGUE.map((o) => <option key={o}>{o}</option>)}</select></label>
          {sel(f.contract, "contract", CONTRATS, "Type de contrat")}
          {sel(f.modality, "modality", MODALITES, "Modalité de travail")}
          <input value={f.location} onChange={set("location")} placeholder="Lieu du poste (si différent du siège)" maxLength={160} />
          <input type="number" min="1" value={f.positions} onChange={set("positions")} placeholder="Nombre de postes" />
          {sel(f.start, "start", DEBUTS, "Date de début")}
          <input value={f.salary} onChange={set("salary")} placeholder="Salaire (ex. 150 000 FCFA par mois)" maxLength={120} />
        </fieldset>

        <fieldset className="seeker-section">
          <legend>Missions et avantages</legend>
          <textarea rows={3} value={f.missions} onChange={set("missions")} placeholder="Missions principales (30 caractères minimum)" required maxLength={1500} />
          <textarea rows={2} value={f.benefits} onChange={set("benefits")} placeholder="Avantages (formation, transport, repas…) — facultatif" maxLength={600} />
        </fieldset>

        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Enregistrement…" : "Continuer vers le paiement"}</button>
      </form>
    </Modal>
  );
}
