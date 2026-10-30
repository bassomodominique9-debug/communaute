import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AuthorBadge } from "./AuthorBadge";

export default function ProfileCardModal({ userId, me, onClose, onNotify, onMessage }) {
  const [card, setCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function load() {
    const { data, error } = await supabase.rpc("get_profile_card", { p_user: userId });
    if (error) {
      setLoadError(/function|schema cache|does not exist/i.test(error.message) ? "Le SQL « partie 8 » n'est pas installé dans Supabase." : error.message);
      return;
    }
    setLoadError("");
    setCard(data);
  }
  useEffect(() => { load(); }, [userId]);

  async function act(name, args) {
    setBusy(true);
    const { error } = await supabase.rpc(name, args);
    setBusy(false);
    if (error) onNotify?.(error.message);
    load();
  }

  const mine = card && card.id === me?.id;
  const state = card?.friendship;
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="auth-modal profile-modal" role="dialog" aria-modal="true" aria-label="Profil" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        {loadError ? <p className="form-error" role="alert">Profil indisponible : {loadError}</p> : !card ? <p>Chargement…</p> : (
          <>
            {card.avatar_url ? <img className="profile-modal-avatar" src={card.avatar_url} alt="" /> : <div className="profile-modal-avatar">{card.full_name.slice(0, 2).toUpperCase()}</div>}
            <h2>{card.full_name}</h2>
            <p><AuthorBadge card={card} /> <span className="header-points">★ {card.points} points</span></p>
            <div className="profile-counts">
              <div><strong>{card.followers}</strong><small>Abonnés</small></div>
              <div><strong>{card.following}</strong><small>Abonnements</small></div>
            </div>
            {!mine && (
              <div className="profile-actions">
                <button type="button" className="button button-primary button-full" onClick={() => (card.can_message ? onMessage(card.id) : onNotify?.("Deviens ami pour lui écrire en privé."))}>✉ Message</button>
                {state === "none" && <button type="button" className="button button-outline button-full" disabled={busy} onClick={() => act("send_friend_request", { p_user: card.id })}>Ajouter en ami</button>}
                {state === "sent" && <button type="button" className="button button-outline button-full" disabled>Demande envoyée</button>}
                {state === "received" && <button type="button" className="button button-outline button-full" disabled={busy} onClick={() => act("respond_friend_request", { p_user: card.id, p_accept: true })}>Accepter la demande</button>}
                {state === "friends" && <button type="button" className="button button-outline button-full" disabled>Amis ✓</button>}
                <button type="button" className="button button-secondary button-full" disabled={busy} onClick={() => act("toggle_follow", { p_user: card.id })}>{card.i_follow ? "Ne plus suivre" : "Suivre"}</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
