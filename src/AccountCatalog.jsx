import "./account-catalog.css";

// Catalogue de « Mon espace » : seulement les options accessibles au rôle du compte
const go = (page) => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page }));

export default function AccountCatalog({ role, onOpen }) {
  const isAdmin = role === "admin";
  const isTrainer = role === "trainer" || isAdmin;
  const isLearner = role === "apprenant";

  const tiles = [
    { key: "profile", icon: "👤", title: "Mon profil", sub: "Informations et photo", open: () => onOpen("profile") },
    { key: "messages", icon: "✉", title: "Messagerie", sub: "Tes conversations", open: () => onOpen("messages") },
    { key: "courses", icon: "▤", title: "Formations", sub: "Inscriptions et programmes", open: () => onOpen("courses") },
    { key: "ateliers", icon: "🧭", title: "Mes ateliers", sub: "Réservations et tickets", open: () => go("atelier") },
    { key: "referral", icon: "🎁", title: "Parrainage", sub: "Code, gains et retraits", open: () => go("referral") },
    { key: "jobs", icon: "⌘", title: "Emploi", sub: "Offres et profil candidat", open: () => go("jobs") },
    ...(isLearner ? [{ key: "learner", icon: "★", title: "Mon parcours", sub: "Exercices, notes, modules", open: () => onOpen("learner") }] : []),
    ...(isTrainer ? [{ key: "trainer", icon: "✎", title: "Espace formateur", sub: "Promotions et suivi", open: () => onOpen("trainer") }] : []),
    ...(isAdmin ? [{ key: "admin", icon: "⚙", title: "Administration", sub: "Gestion de la plateforme", open: () => onOpen("admin") }] : []),
    ...(isAdmin ? [{ key: "coordinator", icon: "◈", title: "Coordination", sub: "Sécurité et accès", open: () => onOpen("coordinator") }] : []),
  ];

  return (
    <section className="account-catalog" aria-label="Options de mon espace">
      <h2 className="account-catalog-title">Mes options</h2>
      <div className="account-catalog-grid">
        {tiles.map((t) => (
          <button key={t.key} type="button" className="account-tile" onClick={t.open}>
            <span className="account-tile-icon" aria-hidden="true">{t.icon}</span>
            <strong>{t.title}</strong>
            <small>{t.sub}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
