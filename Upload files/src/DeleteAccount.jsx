import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function DeleteAccount({ onDeleted, onNotify }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const { error } = await supabase.rpc("delete_my_account");
    setBusy(false);
    if (error) { onNotify?.(/function|schema cache/i.test(error.message) ? "Installe le SQL « partie 11 » dans Supabase." : error.message); return; }
    await supabase.auth.signOut();
    onNotify?.("Ton compte et tes données ont été supprimés.");
    onDeleted?.();
  }

  return (
    <div className="account-content-card danger-zone">
      <h3>Supprimer mon compte</h3>
      <p>Cette action est définitive : ton profil, tes publications, tes messages et tes réservations seront supprimés.</p>
      <button type="button" className="button button-danger" onClick={() => setOpen(true)}>Supprimer mon compte</button>
      {open && (
        <div className="modal-backdrop" role="presentation">
          <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Confirmer la suppression">
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            <h2>Confirmer la suppression</h2>
            <p className="auth-description">Écris <b>SUPPRIMER</b> pour confirmer. Tu ne pourras pas annuler.</p>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="SUPPRIMER" autoCapitalize="characters" />
            <button type="button" className="button button-danger button-full" disabled={busy || text.trim().toUpperCase() !== "SUPPRIMER"} onClick={remove}>{busy ? "Suppression…" : "Supprimer définitivement"}</button>
            <button type="button" className="button button-outline button-full" onClick={() => setOpen(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
