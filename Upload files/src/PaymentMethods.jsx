export default function PaymentMethods({ amount }) {
  const fmt = Number(amount || 0).toLocaleString("fr-FR");
  const code = `#150*46*0439998*${amount}#`;
  return (
    <div className="pay-methods">
      <p>Montant à payer : <strong>{fmt} FCFA</strong>. Choisis ton moyen de paiement :</p>
      <div className="pay-method">
        <b>Orange Money</b>
        <a className="button button-outline button-full" href={`tel:${encodeURIComponent(code)}`}>Composer {code}</a>
      </div>
      <div className="pay-method">
        <b>MTN Mobile Money</b>
        <span>Envoie <strong>{fmt} FCFA</strong> au <strong>653 993 968</strong></span>
      </div>
      <div className="pay-method">
        <b>Virement bancaire — SCB Cameroun</b>
        <span>Compte : <strong>00082 900015288393 68</strong></span>
      </div>
    </div>
  );
}
