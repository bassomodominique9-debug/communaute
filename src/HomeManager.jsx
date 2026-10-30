import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";

const errText = (e) => (/function|schema cache|does not exist|relation/i.test(e?.message || "") ? "Installe le SQL « partie 23 » dans Supabase." : e?.message || "Erreur");
const EMPTY = { first: "", last: "", nationality: "", project: "", portfolio: "", period: "", message: "", photo: "", email: "" };

export default function HomeManager({ user, onNotify }) {
  const [sections, setSections] = useState([]);
  const [tl, setTl] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("home_sections").select("*").order("position");
    if (error) onNotify?.(errText(error)); else setSections(data || []);
    const t = await supabase.from("top_learner").select("*").eq("singleton", true).maybeSingle();
    if (!t.error && t.data && !Array.isArray(t.data)) {
      const d = t.data;
      setTl({ ...EMPTY, first: d.first_name || "", last: d.last_name || "", nationality: d.nationality || "", project: d.project || "",
        portfolio: d.portfolio_url || "", period: d.period || "", message: d.message || "", photo: d.photo_url || "" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(section) {
    const { error } = await supabase.from("home_sections").update({ is_visible: !section.is_visible }).eq("key", section.key);
    if (error) { onNotify?.(errText(error)); return; }
    load();
  }

  async function pickPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { onNotify?.("Choisis une image."); return; }
    setBusy(true);
    try {
      const url = await uploadFile(user, file, "top-learner/");
      setTl((p) => ({ ...p, photo: url }));
      onNotify?.("Photo téléversée. Enregistre pour publier.");
    } catch (err) { onNotify?.(err.message || "Échec du téléversement."); }
    setBusy(false);
  }

  async function saveTop(event) {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_set_top_learner", {
      p_first: tl.first, p_last: tl.last, p_nationality: tl.nationality, p_project: tl.project, p_portfolio: tl.portfolio,
      p_period: tl.period, p_message: tl.message, p_photo: tl.photo, p_email: tl.email,
    });
    setBusy(false);
    if (error) { onNotify?.(errText(error)); return; }
    onNotify?.(data?.linked ? "Meilleur apprenant mis à jour (compte relié)." : "Mis à jour. Indique l'e-mail du membre pour activer Contacter et Encourager.");
  }

  const set = (k) => (e) => setTl({ ...tl, [k]: e.target.value });

  async function removePhoto() {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_top_learner", {
      p_first: tl.first, p_last: tl.last, p_nationality: tl.nationality, p_project: tl.project, p_portfolio: tl.portfolio,
      p_period: tl.period, p_message: tl.message, p_photo: "", p_email: tl.email,
    });
    setBusy(false);
    if (error) { onNotify?.(errText(error)); return; }
    setTl((p) => ({ ...p, photo: "" }));
    onNotify?.("Photo retirée.");
  }

  return (
    <>
      <div className="account-content-card">
        <h3>Sections de la page d'accueil</h3>
        {sections.map((s) => (
          <div key={s.key} className="admin-row">
            <strong>{s.label}</strong>
            <button type="button" className={s.is_visible ? "button button-outline" : "button button-danger"} onClick={() => toggle(s)}>
              {s.is_visible ? "Visible · masquer" : "Masqué · afficher"}
            </button>
          </div>
        ))}
      </div>
      <form className="account-content-card admin-form" onSubmit={saveTop}>
        <h3>Meilleur apprenant</h3>
        <p>Laisse le prénom vide pour afficher le point d'interrogation.</p>
        <input value={tl.first} onChange={set("first")} placeholder="Prénom" maxLength={60} />
        <input value={tl.last} onChange={set("last")} placeholder="Nom" maxLength={60} />
        <input value={tl.nationality} onChange={set("nationality")} placeholder="Nationalité" maxLength={60} />
        <textarea rows={2} value={tl.project} onChange={set("project")} placeholder="Projet réalisé" maxLength={300} />
        <input type="url" value={tl.portfolio} onChange={set("portfolio")} placeholder="Lien du portfolio (https://…)" />
        <input value={tl.period} onChange={set("period")} placeholder="Promotion ou mois" maxLength={80} />
        <textarea rows={2} value={tl.message} onChange={set("message")} placeholder="Un mot sur son parcours" maxLength={300} />
        <input type="email" value={tl.email} onChange={set("email")} placeholder="E-mail du compte membre (pour Contacter / Encourager)" />
        <label>Photo<input type="file" accept="image/*" onChange={pickPhoto} disabled={busy} /></label>
        {tl.photo && <img className="top-learner-preview" src={tl.photo} alt="Aperçu" />}
        {tl.photo && <button type="button" className="button button-danger" onClick={removePhoto} disabled={busy}>Retirer la photo</button>}
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
      </form>
    </>
  );
}
