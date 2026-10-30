import { supabase } from "./supabaseClient";
import PaymentFlow from "./PaymentFlow";

export default function CoursePayment({ course, regId, whatsapp, whatsappText, onNotify }) {
  const wa = (
    <a className="button button-outline button-full" href={`${whatsapp}?text=${encodeURIComponent(whatsappText || "")}`} target="_blank" rel="noopener noreferrer">
      Une question ? Écris-nous sur WhatsApp
    </a>
  );
  if (!course.price || !regId) return (<><p>Ta demande est enregistrée. Notre équipe te contactera.</p>{wa}</>);

  async function submit({ transactionId, proofUrl }) {
    const { error } = await supabase.rpc("submit_course_payment", { p_registration_id: regId, p_transaction_id: transactionId });
    if (error) throw error;
    const { error: pErr } = await supabase.rpc("attach_payment_proof", { p_kind: "formation", p_id: regId, p_url: proofUrl });
    if (pErr) throw pErr;
  }

  return (
    <>
      <PaymentFlow
        amount={course.price}
        onSubmit={submit}
        onDone={() => onNotify?.("Preuve envoyée. Notre équipe vérifie ton paiement.")}
        doneMessage="Preuve envoyée. Notre équipe vérifie ton paiement : tu recevras la confirmation dans tes notifications, et le bouton School s'affichera sur ton profil."
      />
      {wa}
    </>
  );
}
