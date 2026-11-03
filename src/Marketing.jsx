import { useState } from "react";
import "./marketing.css";

const go = (page) => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page }));

// Témoignages : publiés par les membres, validés par l'administrateur (liste vide tant qu'il n'y en a pas)
export const TESTIMONIALS = [];

const PROFILE_FIELDS = ["full_name", "phone", "city", "country", "avatar_url"];

// Flèche de retour : icône seule, discrète
export function BackArrow({ onClick }) {
  return <button type="button" className="mk-back" aria-label="Retour" onClick={onClick}>‹</button>;
}

// Barre de progression du profil (dans Mon espace)
export function ProfileProgress({ profile }) {
  const filled = PROFILE_FIELDS.filter((k) => profile && profile[k] && String(profile[k]).trim() !== "").length;
  const percent = Math.round((filled / PROFILE_FIELDS.length) * 100);
  return (
    <section className="mk-progress" aria-label="Profil complété">
      <div className="mk-progress-top"><strong>Mon profil</strong><span className="mk-pct">{percent}%</span></div>
      <div className="mk-bar"><span style={{ width: `${percent}%` }} /></div>
      <small>{percent === 100 ? "Bravo, ton profil est complet 🎉" : "Encore un peu pour être bien repéré ✨"}</small>
    </section>
  );
}

// Parcours « Compléter mon profil » (dans Mon espace) : 3 étapes, ouvertes au toucher
export function CompleteProfilePanel({ onBack, onOpenProfile }) {
  const steps = [
    { icon: "📍", title: "Compléter mon profil", text: "Adresse et numéro de téléphone", action: onOpenProfile },
    { icon: "📸", title: "Ajouter une photo", text: "Une photo de profil", action: onOpenProfile },
    { icon: "💬", title: "Faire une publication", text: "Dis bonjour à la communauté", action: () => go("community") },
  ];
  return (
    <section className="mk-panel">
      <header className="mk-panel-head"><BackArrow onClick={onBack} /><strong>Compléter mon profil</strong></header>
      {steps.map((s) => (
        <button key={s.title} type="button" className="mk-chip" onClick={s.action}>
          <span className="mk-chip-icon">{s.icon}</span>
          <span><b>{s.title}</b><small>{s.text}</small></span>
          <span className="mk-chevron">›</span>
        </button>
      ))}
    </section>
  );
}

// Suivi visible : le détail s'ouvre au toucher
function TrackPanel() {
  const steps = [
    ["📨", "Demande envoyée", "Ta demande est bien reçue."],
    ["💳", "Paiement reçu", "Le paiement est enregistré."],
    ["✅", "Confirmée", "L'équipe a vérifié ta demande."],
    ["🎁", "Livrée", "Ta commande ou ta formation est prête."],
  ];
  return (
    <div className="mk-steps">
      {steps.map(([icon, title, text], i) => (
        <div key={title} className="mk-step-line">
          <span className="mk-step-dot">{icon}</span>
          <span><b>{i + 1}. {title}</b><small>{text}</small></span>
        </div>
      ))}
      <small className="mk-note">Tu retrouves l'étape de ta demande dans Mon espace.</small>
    </div>
  );
}

const FAQ_ITEMS = [
  ["💳", "Comment payer ?", "Orange Money, MTN Mobile Money ou virement. Envoie la photo de ta transaction pour confirmation."],
  ["⏱", "Quel délai de confirmation ?", "L'équipe confirme ton paiement dès qu'elle le reçoit, en général dans la journée."],
  ["🔄", "Puis-je changer de formation ?", "Écris-nous sur WhatsApp : nous regardons ensemble les options possibles."],
  ["🔒", "Mes données sont-elles protégées ?", "Tes informations servent uniquement à ton suivi. Tu peux demander la suppression de ton compte."],
];

function FaqPanel() {
  const [open, setOpen] = useState(null);
  return (
    <div className="mk-faq-list">
      {FAQ_ITEMS.map(([icon, q, a], i) => (
        <div key={q} className="mk-faq-row">
          <button type="button" className="mk-faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{icon}</span><b>{q}</b><span className="mk-chevron">{open === i ? "⌄" : "›"}</span>
          </button>
          {open === i && <p>{a}</p>}
        </div>
      ))}
    </div>
  );
}

// Accueil : trois petites lignes ; chaque ligne s'ouvre avec une flèche de retour
export function HomeMini() {
  const [view, setView] = useState(null);
  const rows = [
    { key: "suivi", icon: "📦", title: "Suivre ma demande" },
    { key: "faq", icon: "❓", title: "Questions fréquentes" },
    { key: "about", icon: "🏢", title: "Qui sommes-nous et conditions" },
  ];
  function open(key) {
    if (key === "about") { go("about"); return; }
    setView(key);
  }
  if (view === "suivi" || view === "faq") {
    const title = view === "suivi" ? "Suivre ma demande" : "Questions fréquentes";
    return (
      <section className="mk-panel">
        <header className="mk-panel-head"><BackArrow onClick={() => setView(null)} /><strong>{title}</strong></header>
        {view === "suivi" ? <TrackPanel /> : <FaqPanel />}
      </section>
    );
  }
  return (
    <section className="mk-mini" aria-label="Aide">
      {rows.map((r) => (
        <button key={r.key} type="button" className="mk-chip mk-chip-slim" onClick={() => open(r.key)}>
          <span className="mk-chip-icon">{r.icon}</span><b>{r.title}</b><span className="mk-chevron">›</span>
        </button>
      ))}
    </section>
  );
}

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="mk-testimonials" aria-label="Témoignages">
      <div className="mk-row-scroll">
        {TESTIMONIALS.map((t, i) => (
          <article key={i} className="mk-quote"><p>« {t.text} »</p><strong>{t.name}</strong><small>{t.city}</small></article>
        ))}
      </div>
    </section>
  );
}

// Page « Qui sommes-nous et conditions » : flèche de retour en haut
export function AboutPage() {
  return (
    <section className="mk-about" aria-label="Qui sommes-nous">
      <header className="mk-panel-head"><BackArrow onClick={() => go("home")} /><strong>Qui sommes-nous</strong></header>
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
