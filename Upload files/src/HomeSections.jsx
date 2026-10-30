import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./lot5.css";

const notify = (message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }));

export default function HomeGate({ section, children, defaultVisible = true }) {
  const [visible, setVisible] = useState(defaultVisible);
  useEffect(() => {
    let active = true;
    supabase.from("home_sections").select("key, is_visible").eq("key", section).maybeSingle().then(({ data, error }) => {
      if (active && !error && data && typeof data.is_visible === "boolean") setVisible(data.is_visible);
    });
    return () => { active = false; };
  }, [section]);
  return visible ? children : null;
}

export function TopLearner() {
  const [row, setRow] = useState(null);
  const [mode, setMode] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("top_learner").select("*").eq("singleton", true).maybeSingle().then(({ data, error }) => {
      if (!error && data && !Array.isArray(data)) setRow(data);
    });
  }, []);

  const fullName = [row?.first_name, row?.last_name].filter(Boolean).join(" ") || row?.name?.trim();

  async function send() {
    if (!row?.user_id) { notify("Cette fiche n'est pas encore reliée à un compte membre."); return; }
    if (text.trim().length < 2) { notify("Écris un message court."); return; }
    setBusy(true);
    const { error } = await supabase.rpc("platform_message", { p_to: row.user_id, p_text: text.trim(), p_kind: mode });
    setBusy(false);
    if (error) { notify(error.message); return; }
    setText(""); setMode(null);
    notify(mode === "encouragement" ? "Ton encouragement a été envoyé." : "Ton message a été envoyé.");
  }

  return (
    <section className="section-container top-learner" aria-label="Meilleur apprenant">
      <span className="eyebrow">MEILLEUR APPRENANT</span>
      <div className="top-learner-card">
        <div className="top-learner-avatar">
          {row?.photo_url ? <img src={row.photo_url} alt={fullName || "Meilleur apprenant"} /> : <span>?</span>}
        </div>
        {fullName ? (
          <>
            <h2>{fullName}</h2>
            {row?.nationality && <small>{row.nationality}{row?.period ? ` · ${row.period}` : ""}</small>}
            {row?.project && <p><b>Projet réalisé :</b> {row.project}</p>}
            {row?.message && <p>{row.message}</p>}
            {row?.portfolio_url && <a className="top-learner-link" href={row.portfolio_url} target="_blank" rel="noopener noreferrer">Voir le portfolio</a>}
            <div className="top-learner-actions">
              <button type="button" className="button button-outline" onClick={() => setMode("contact")}>Contacter l'apprenant</button>
              <button type="button" className="button button-primary" onClick={() => setMode("encouragement")}>Encourager</button>
            </div>
            {mode && (
              <div className="top-learner-form">
                <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)}
                  placeholder={mode === "contact" ? "Ton message pour l'apprenant" : "Un mot d'encouragement"} />
                <button type="button" className="button button-primary" disabled={busy} onClick={send}>{busy ? "Envoi…" : "Envoyer"}</button>
              </div>
            )}
          </>
        ) : (
          <>
            <h2>À venir</h2>
            <p>Le meilleur apprenant du moment sera annoncé ici.</p>
          </>
        )}
      </div>
    </section>
  );
}
