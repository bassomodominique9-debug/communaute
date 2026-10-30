import { useState } from "react";
import { supabase } from "./supabaseClient";

const LABEL = { unpaid: "non payé", pending: "à vérifier", confirmed: "confirmé" };

export default function RegPayment({ reg, onDone, onNotify }) {
  const [ref, setRef] = useState("");
  if (!reg.amount_xaf && !reg.transaction_id) return null;
  async function confirm() {
    const { error } = await supabase.rpc("staff_confirm_course_payment", { p_registration_id: reg.id, p_reference: ref.trim() });
    if (error) { onNotify?.(error.message); return; }
    onNotify?.("Paiement confirmé."); setRef(""); onDone?.();
  }
  return (
    <div className="reg-pay">
      <small>Montant : {Number(reg.amount_xaf || 0).toLocaleString("fr-FR")} FCFA · Paiement {LABEL[reg.payment_status] || ""}{reg.transaction_id ? ` · ID client : ${reg.transaction_id}` : ""}</small>
      {reg.payment_status === "pending" && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Retape l'ID de transaction du client" />
          <button type="button" className="button button-primary" onClick={confirm}>Confirmer</button>
        </div>
      )}
    </div>
  );
}
