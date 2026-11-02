import { useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import "./attestations-lot7.css";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 40 » dans Supabase." : e?.message || "Erreur");
const dateFr = (value) => new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const todayFr = () => new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// Référence unique, générée à la création du prompt et reprise à l'envoi
const makeRef = () => `ED-ATT-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`;

function buildPrompt(f, ref) {
  return `Remplis le modèle d'attestation fourni avec les informations ci-dessous. Garde exactement le modèle : le fond blanc, les bordures dorées et bleues, le titre « ATTESTATION NUMÉRIQUE de Formation » et les deux logos ED B-CENTER en haut, sans les modifier, les déformer ni les recolorer.

Ajoute uniquement le texte suivant, centré dans la zone blanche sous le titre, en bleu nuit (#0A2E7A) :

« ED B-CENTER atteste que ${f.name.trim()}, originaire de ${f.city.trim()}, ${f.country.trim()}, a suivi avec assiduité la formation en ligne proposée par ED B-CENTER, du ${dateFr(f.start)} au ${dateFr(f.end)}. »

Nom complet en gras et un peu plus grand que le reste du texte. Dates en toutes lettres, en français.

En bas à gauche, petit texte : « Fait à Douala, le ${todayFr()} ».
En bas à droite, au-dessus d'une petite ligne : « Le Directeur » (laisse l'espace de signature vide).
En bas au centre, très petit, gris : « Référence : ${ref} ».

Couleurs ED B-CENTER : bleu royal #1677FF, bleu nuit #0A2E7A, or #E8B84A. Pas de rouge, pas de texte supplémentaire, pas de promesse d'emploi. Format paysage, lisible sur téléphone.`;
}

// Administrateur : formulaire -> prompt à copier -> envoi de l'attestation générée
export function AttestationAdmin() {
  const [f, setF] = useState({ email: "", name: "", start: "", end: "", city: "", country: "" });
  const [prompt, setPrompt] = useState("");
  const [ref, setRef] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function makePrompt(event) {
    event.preventDefault();
    if (f.start && f.end && f.end < f.start) { notify("La date de fin doit être après la date de début."); return; }
    const newRef = makeRef();
    setRef(newRef);
    setPrompt(buildPrompt(f, newRef));
  }

  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); notify("Prompt copié. Colle-le dans l'IA avec le modèle."); }
    catch { notify("Copie impossible : sélectionne le texte et copie-le."); }
  }

  async function send() {
    if (!file) { notify("Ajoute l'attestation générée."); return; }
    if (!file.type.startsWith("image/")) { notify("L'attestation doit être une image."); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = await uploadFile(user, file, "attestations/");
      const { error } = await supabase.rpc("admin_issue_attestation", {
        p_email: f.email, p_full_name: f.name, p_start: f.start, p_end: f.end,
        p_city: f.city, p_country: f.country, p_image: url, p_reference: ref,
      });
      if (error) throw error;
      notify("Attestation envoyée à l'apprenant.");
      setFile(null); setPrompt(""); setRef("");
      setF({ email: "", name: "", start: "", end: "", city: "", country: "" });
    } catch (err) { notify(errMsg(err)); }
    setBusy(false);
  }

  return (
    <section className="attest-admin" aria-label="Attestations numériques">
      <span className="eyebrow">ATTESTATIONS NUMÉRIQUES</span>
      <h2>Émettre une attestation</h2>
      <form className="attest-form" onSubmit={makePrompt}>
        <input type="email" value={f.email} onChange={set("email")} placeholder="E-mail du compte de l'apprenant" required />
        <input value={f.name} onChange={set("name")} placeholder="Nom complet" required maxLength={120} />
        <label>Début de la formation en ligne<input type="date" value={f.start} onChange={set("start")} required /></label>
        <label>Fin de la formation en ligne<input type="date" value={f.end} onChange={set("end")} required /></label>
        <input value={f.city} onChange={set("city")} placeholder="Ville" required maxLength={80} />
        <input value={f.country} onChange={set("country")} placeholder="Pays" required maxLength={80} />
        <button type="submit" className="button button-primary">Valider et créer le prompt</button>
      </form>

      {prompt && (
        <div className="attest-prompt">
          <strong>Prompt prêt</strong>
          <textarea readOnly rows={8} value={prompt} />
          <button type="button" className="button button-outline" onClick={copyPrompt}>Copier le prompt</button>

          <div className="attest-send">
            <strong>Envoyer à l'apprenant</strong>
            <label>Attestation générée (image)<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
            <button type="button" className="button button-primary" disabled={busy} onClick={send}>{busy ? "Envoi…" : "Envoyer l'attestation"}</button>
          </div>
        </div>
      )}
    </section>
  );
}

// Apprenant : ses attestations, à consulter et télécharger
export function MyAttestations() {
  const [list, setList] = useState(null);
  useState(() => {
    supabase.rpc("my_attestations").then(({ data, error }) => {
      if (error) { setList([]); return; }
      setList(Array.isArray(data) ? data : []);
    });
  });
  return (
    <section className="attest-mine" aria-label="Mes attestations">
      <span className="eyebrow">MES ATTESTATIONS</span>
      <h2>Attestations de formation</h2>
      {list === null && <p className="attest-note">Chargement…</p>}
      {list && list.length === 0 && <p className="attest-note">Aucune attestation pour le moment.</p>}
      {list && list.map((a) => (
        <article key={a.id} className="attest-card">
          <img src={a.image_url} alt={`Attestation ${a.reference}`} loading="lazy" />
          <div>
            <strong>{a.full_name}</strong>
            <small>Référence : {a.reference}</small>
            <a className="button button-primary" href={a.image_url} target="_blank" rel="noopener noreferrer" download>Télécharger</a>
          </div>
        </article>
      ))}
    </section>
  );
}
