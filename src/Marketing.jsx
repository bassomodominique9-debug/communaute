import "./marketing.css";

const go = (page) => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page }));

// Témoignages : ajoute ici de vrais témoignages (prénom, ville, texte, accord écrit). Ne pas inventer.
export const TESTIMONIALS = [];

// Champs du profil utilisés pour la barre de progression
const PROFILE_FIELDS = ["full_name", "phone", "city", "country", "avatar_url"];

export function ProfileProgress({ profile }) {
  const filled = PROFILE_FIELDS.filter((k) => profile && profile[k] && String(profile[k]).trim() !== "").length;
  const percent = Math.round((filled / PROFILE_FIELDS.length) * 100);
  return (
    <section className="mk-progress" aria-label="Profil complété">
      <div className="mk-row"><strong>Ton profil</strong><span>{percent} %</span></div>
      <div className="mk-bar"><span style={{ width: `${percent}%` }} /></div>
      {percent < 100 && <small>Complète ton profil pour recevoir les bonnes offres et les bons ateliers.</small>}
      {percent === 100 && <small>Profil complet. Merci !</small>}
    </section>
  );
}

export function Onboarding({ profile }) {
  const done1 = PROFILE_FIELDS.some((k) => profile && profile[k]);
  const steps = [
    { n: 1, title: "Complète ton profil", text: "Nom, téléphone, ville.", done: done1, action: () => go("account") },
    { n: 2, title: "Fais ton premier exercice", text: "Commence une formation.", done: false, action: () => go("courses") },
    { n: 3, title: "Invite une personne", text: "Partage ton code de parrainage.", done: false, action: () => go("account") },
  ];
  return (
    <section className="mk-onboarding" aria-label="Premiers pas">
      <span className="mk-eyebrow">PREMIERS PAS</span>
      <h2>3 étapes pour bien commencer</h2>
      <ol className="mk-steps">
        {steps.map((s) => (
          <li key={s.n}>
            <button type="button" className={s.done ? "mk-step mk-step-done" : "mk-step"} onClick={s.action}>
              <span className="mk-num">{s.done ? "✓" : s.n}</span>
              <span><strong>{s.title}</strong><small>{s.text}</small></span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="mk-testimonials" aria-label="Témoignages">
      <span className="mk-eyebrow">ILS ONT COMMENCÉ</span>
      <h2>Ce que disent nos membres</h2>
      <div className="mk-row-scroll">
        {TESTIMONIALS.map((t, i) => (
          <article key={i} className="mk-quote">
            <p>« {t.text} »</p>
            <strong>{t.name}</strong><small>{t.city}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

// Suivi visible : chaque étape d'une demande
export function OrderSteps() {
  const steps = ["Demande envoyée", "Paiement reçu", "Confirmation par l'équipe", "Livraison"];
  return (
    <section className="mk-order" aria-label="Suivi de commande">
      <span className="mk-eyebrow">SUIVI</span>
      <h2>Où en est ta demande ?</h2>
      <ol className="mk-track">
        {steps.map((s, i) => (<li key={s}><span className="mk-dot">{i + 1}</span>{s}</li>))}
      </ol>
      <small>Tu vois l'étape de ta demande dans ton espace, à chaque moment.</small>
    </section>
  );
}

export function Faq() {
  const items = [
    ["Comment payer ?", "Orange Money, MTN Mobile Money ou virement. Envoie la photo de ta transaction pour confirmation."],
    ["Quel délai de confirmation ?", "L'équipe confirme ton paiement dès qu'elle le reçoit, en général dans la journée."],
    ["Puis-je changer de formation ?", "Écris-nous sur WhatsApp, nous regardons ensemble les options possibles."],
    ["Mes données sont-elles protégées ?", "Tes informations servent uniquement à ton suivi. Tu peux demander la suppression de ton compte."],
  ];
  return (
    <section className="mk-faq" aria-label="Questions fréquentes">
      <span className="mk-eyebrow">FAQ</span>
      <h2>Questions fréquentes</h2>
      {items.map(([q, a]) => (
        <details key={q} className="mk-faq-item">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  );
}

// Page « Qui sommes-nous » et conditions : à compléter avec les infos réelles
export function AboutPage() {
  return (
    <section className="mk-about" aria-label="Qui sommes-nous">
      <span className="mk-eyebrow">QUI SOMMES-NOUS</span>
      <h2>ED B-CENTER</h2>
      <p>ED B-CENTER forme, accompagne et suit les personnes qui veulent apprendre un métier, trouver un emploi ou lancer leur activité. Nous sommes basés à Douala, Cameroun.</p>
      <p><strong>Responsable :</strong> Équipe ED B-CENTER</p>
      <p><strong>Contact :</strong> WhatsApp +237 653 99 39 68 · Email : edbusinesscenter@gmail.com</p>

      <h3>Conditions d'utilisation</h3>
      <p>En utilisant l'application, tu t'engages à fournir des informations exactes, à respecter les autres membres et à ne pas publier de contenu trompeur. Les prix sont affichés avant tout paiement. Les délais et les modalités de remboursement sont indiqués sur chaque prestation.</p>

      <h3>Données personnelles</h3>
      <p>Les informations que tu fournis servent à gérer ton compte, tes formations et tes demandes. Elles ne sont pas vendues. Tu peux demander à tout moment la correction ou la suppression de ton compte.</p>
    </section>
  );
}
