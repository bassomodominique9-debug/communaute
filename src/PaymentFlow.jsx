import { useState } from "react";
import { uploadProof } from "./paymentProof";
import PaymentMethods from "./PaymentMethods";

export default function PaymentFlow({ amount, onSubmit, doneMessage, onDone }) {
  const [step, setStep] = useState(1);
  const [tx, setTx] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm(event) {
    event.preventDefault();
    if (tx.trim().length < 6) { setError("Entre l'ID de transaction complet reçu par SMS."); return; }
    if (!file) { setError("La photo de la transaction est obligatoire (capture du SMS)."); return; }
    setBusy(true); setError("");
    try {
      const proofUrl = await uploadProof(file);
      await onSubmit({ transactionId: tx.trim(), proofUrl });
    } catch (err) {
      setBusy(false);
      setError(err?.message || "Une erreur est survenue.");
      return;
    }
    setBusy(false);
    setStep(3);
    onDone?.();
  }

  if (step === 1) return (
    <>
      <PaymentMethods amount={amount} />
      <button type="button" className="button button-primary button-full" onClick={() => setStep(2)}>J'ai payé</button>
    </>
  );

  if (step === 2) return (
    <form onSubmit={confirm} className="atelier-reservation-form">
      <p>Renseigne l'<strong>ID de transaction</strong> reçu par SMS, puis joins la photo de la transaction.</p>
      <label>ID de transaction
        <input value={tx} onChange={(e) => setTx(e.target.value)} required maxLength={40} autoComplete="off" autoCapitalize="characters" placeholder="CI000000.0000.C00000" />
      </label>
      <label>Photo de la transaction (obligatoire)
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
      </label>
      {file && <small>✓ {file.name}</small>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? "Envoi…" : "Confirmer"}</button>
      <button type="button" className="button button-outline button-full" onClick={() => setStep(1)}>Retour</button>
    </form>
  );

  return <p>{doneMessage}</p>;
}
