import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import PaymentFlow from "./PaymentFlow";
import "./referral.css";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const fmt = (n) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`;
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 28 » dans Supabase." : e?.message || "Erreur");
const LINK = (code) => `${window.location.origin}${window.location.pathname}?ref=${code}`;
const STATUS = { validated: "Validé", pending: "En attente", cancelled: "Annulé", requested: "Demandé", approved: "Approuvé", paid: "Payé", rejected: "Refusé", awaiting_payment: "À payer", confirmed: "Confirmé" };

export default function ReferralPanel() {
  const [hub, setHub] = useState(null);
  const [code, setCode] = useState(null);
  const [applyText, setApplyText] = useState("");
  const [wName, setWName] = useState("");
  const [wPhone, setWPhone] = useState("");
  const [renewal, setRenewal] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const c = await supabase.rpc("ensure_my_code");
    if (c.error) { notify(errMsg(c.error)); return; }
    setCode(c.data);
    const h = await supabase.rpc("my_referral_hub");
    if (h.error) { notify(errMsg(h.error)); return; }
    setHub(h.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Code de parrainage tiré du lien (?ref=ED-B…)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setApplyText(ref.toUpperCase());
  }, []);

  async function apply(event) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("apply_referral_code", { p_code: applyText });
    setBusy(false);
    if (error) { notify(errMsg(error)); return; }
    notify("Code enregistré. La récompense du parrain est validée une fois ton profil complété.");
    setApplyText(""); load();
  }

  async function withdraw(event) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", { p_name: wName, p_phone: wPhone });
    setBusy(false);
    if (error) { notify(errMsg(error)); return; }
    notify(`Demande envoyée. Délai de traitement : ${hub.delay_hours} heures.`);
    setWName(""); setWPhone(""); load();
  }

  async function askRenewal() {
    setBusy(true);
    const { data, error } = await supabase.rpc("request_renewal");
    setBusy(false);
    if (error) { notify(errMsg(error)); return; }
    setRenewal(data);
  }

  if (!hub || !code) return <section className="section-container referral"><p>Chargement du parrainage…</p></section>;

  const copy = async () => {
    const link = LINK(hub.code || code.code);
    try { await navigator.clipboard.writeText(link); notify("Lien copié."); } catch (e) { notify(link); }
  };
  const remaining = Math.max(hub.min_withdraw - hub.available, 0);

  return (
    <section className="section-container referral" aria-label="Parrainage">
      <span className="eyebrow">PARRAINAGE</span>
      <h1>Mon parrainage</h1>

      <div className="referral-code-card">
        <small>Mon code</small>
        <strong className="referral-code">{hub.expired ? "Expiré" : hub.code || code.code}</strong>
        {!hub.expired && <small>{hub.uses} / {hub.max} comptes utilisés</small>}
        {!hub.expired && <button type="button" className="button button-outline" onClick={copy}>Copier le lien</button>}
        {hub.expired && !renewal && !hub.renewal_pending && (
          <button type="button" className="button button-primary" disabled={busy} onClick={askRenewal}>Obtenir un nouveau code ({fmt(hub.renewal_price)})</button>
        )}
        {renewal && (
          <PaymentFlow amount={renewal.amount} onSubmit={async ({ transactionId, proofUrl }) => {
            const { error } = await supabase.rpc("submit_renewal_payment", { p_id: renewal.renewal_id, p_tx: transactionId, p_proof: proofUrl });
            if (error) throw error;
          }} onDone={() => { setRenewal(null); load(); }}
          doneMessage="Paiement envoyé. L'équipe confirme et ton nouveau code apparaîtra ici." />
        )}
        {hub.renewal_pending && !renewal && <small>Renouvellement en attente de confirmation.</small>}
      </div>

      <div className="referral-stats">
        <div><span>Comptes attribués</span><strong>{hub.attributed}</strong></div>
        <div><span>Comptes validés</span><strong>{hub.validated}</strong></div>
        <div><span>À 100 F</span><strong>{hub.count_first}</strong></div>
        <div><span>À 50 F</span><strong>{hub.count_renewed}</strong></div>
      </div>

      <div className="referral-balance account-content-card">
        <div><span>Solde disponible</span><strong>{fmt(hub.available)}</strong></div>
        <div><span>En attente de validation</span><strong>{fmt(hub.pending)}</strong></div>
        <div><span>Total retiré</span><strong>{fmt(hub.withdrawn)}</strong></div>
        <small>Prochaine récompense : {fmt(hub.rate_next)} par compte validé.</small>
        {hub.available >= hub.min_withdraw ? (
          <form className="admin-form" onSubmit={withdraw}>
            <input value={wName} onChange={(e) => setWName(e.target.value)} placeholder="Nom du compte (mobile money)" required maxLength={120} />
            <input value={wPhone} onChange={(e) => setWPhone(e.target.value)} placeholder="Numéro de téléphone" required maxLength={30} />
            <button type="submit" className="button button-primary" disabled={busy}>Demander le retrait de {fmt(hub.available)}</button>
            <small>Délai de traitement : {hub.delay_hours} heures.</small>
          </form>
        ) : (
          <small>Retrait possible à partir de {fmt(hub.min_withdraw)}. Il te manque {fmt(remaining)}.</small>
        )}
      </div>

      {!hub.applied_code && (
        <form className="account-content-card admin-form" onSubmit={apply}>
          <h3>Tu as été invité ?</h3>
          <input value={applyText} onChange={(e) => setApplyText(e.target.value.toUpperCase())} placeholder="Code de parrainage (ED-B…)" maxLength={10} />
          <button type="submit" className="button button-outline" disabled={busy || applyText.trim().length < 10}>Valider le code</button>
        </form>
      )}
      {hub.applied_code && <p className="referral-note">Tu as été invité avec le code {hub.applied_code}.</p>}

      <div className="account-content-card">
        <h3>Historique</h3>
        {hub.history.length === 0 && hub.withdrawals.length === 0 && <p>Aucune transaction pour le moment.</p>}
        {hub.history.map((h, i) => (
          <div key={`h${i}`} className="admin-row"><span>{new Date(h.at).toLocaleDateString("fr-FR")}</span><b>+{fmt(h.amount)}</b><small>{STATUS[h.status] || h.status}</small></div>
        ))}
        {hub.withdrawals.map((w, i) => (
          <div key={`w${i}`} className="admin-row"><span>{new Date(w.at).toLocaleDateString("fr-FR")}</span><b>−{fmt(w.amount)}</b><small>Retrait · {STATUS[w.status] || w.status}</small></div>
        ))}
      </div>

      <div className="account-content-card referral-rules">
        <h3>Comment ça marche</h3>
        <p>Chaque compte validé qui utilise ton code te rapporte la récompense en vigueur, affichée au-dessus. Un compte est validé quand son profil est complété.</p>
        <p>Un code permet de créer {hub.max} comptes. Il expire ensuite : renouvelle-le pour {fmt(hub.renewal_price)}.</p>
        <p>Retrait possible à partir de {fmt(hub.min_withdraw)}, traité sous {hub.delay_hours} heures.</p>
      </div>
    </section>
  );
}
