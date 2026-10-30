import { supabase } from "./supabaseClient";
import PaymentFlow from "./PaymentFlow";

export default function TicketPayment({ payment, onClose, onNotify }) {
  async function submit({ transactionId, proofUrl }) {
    if (!payment?.id) throw new Error("Réservation introuvable. Recommence la réservation.");
    const { error } = await supabase.rpc("submit_workshop_payment", { p_reservation_id: payment.id, p_transaction_id: transactionId });
    if (error) throw error;
    const { error: pErr } = await supabase.rpc("attach_payment_proof", { p_kind: "ticket", p_id: payment.id, p_url: proofUrl });
    if (pErr) throw pErr;
  }
  return (
    <div className="atelier-modal-backdrop" role="presentation">
      <section className="atelier-reservation-modal" role="dialog" aria-modal="true" aria-label="Paiement du ticket">
        <button className="atelier-modal-close" type="button" onClick={onClose} aria-label="Fermer">×</button>
        <span className="eyebrow">PAIEMENT DU TICKET</span>
        <h2>{payment?.title}</h2>
        <PaymentFlow
          amount={2500}
          onSubmit={submit}
          onDone={() => onNotify?.("Preuve envoyée. Ton ticket sera confirmé après vérification.")}
          doneMessage="Preuve envoyée. Ton ticket sera confirmé après vérification par l'administrateur. Tu peux suivre l'état dans tes notifications."
        />
      </section>
    </div>
  );
}
