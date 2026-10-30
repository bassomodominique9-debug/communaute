import { useState } from "react";
import { supabase } from "./supabaseClient";

const REASONS = ["Contenu inapproprié", "Harcèlement ou insultes", "Arnaque ou fausse information", "Spam ou publicité", "Autre"];

export default function ReportDialog({ post, onClose, onNotify }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("report_publication", { p_publication_id: post.id, p_reason: reason, p_details: details.trim() || null });
    setBusy(false);
    if (error) { onNotify?.(/function|schema cache/i.test(error.message) ? "Installe le SQL « partie 11 » dans Supabase." : error.message); return; }
    onNotify?.("Merci : ton signalement a été envoyé à l'équipe.");
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="auth-modal" onSubmit={send} role="dialog" aria-modal="true" aria-label="Signaler une publication">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>Signaler cette publication</h2>
        <p className="auth-description">Dis-nous pourquoi. L'équipe examinera le contenu.</p>
        {REASONS.map((item) => (
          <label key={item} className="admin-check"><input type="radio" name="reason" checked={reason === item} onChange={() => setReason(item)} /> {item}</label>
        ))}
        <textarea rows={3} maxLength={300} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Précisions (facultatif)" />
        <button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? "Envoi…" : "Envoyer le signalement"}</button>
      </form>
    </div>
  );
}
