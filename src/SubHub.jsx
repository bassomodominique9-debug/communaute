import { useState } from "react";
import "./account-catalog.css";
import AdminSpace from "./AdminSpace";
import ParcoursManager from "./ParcoursManager";
import PortfolioStaff from "./PortfolioStaff";
import CoordinatorPanel from "./CoordinatorPanel";

// Catalogue d'options (même style que « Mes options »)
function SubCatalog({ items, onOpen }) {
  return (
    <section className="account-catalog" aria-label="Options">
      <div className="account-catalog-grid">
        {items.map((t) => (
          <button key={t.key} type="button" className="account-tile" onClick={() => onOpen(t.key)}>
            <span className="account-tile-icon" aria-hidden="true">{t.icon}</span>
            <strong>{t.title}</strong>
            <small>{t.sub}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

// Un niveau de catalogue : liste des options, puis option ouverte avec bouton retour
function Hub({ items, renderOption }) {
  const [current, setCurrent] = useState(null);
  if (!current) return <SubCatalog items={items} onOpen={setCurrent} />;
  return (
    <div className="sub-hub">
      <button type="button" className="account-back sub-back" onClick={() => setCurrent(null)}>‹ Retour à la liste de cette section</button>
      {renderOption(current)}
    </div>
  );
}

const ADMIN_ITEMS = [
  ["stats", "Tableau de bord", "📊"], ["formations", "Formations", "🎓"], ["prices", "Prix", "💲"],
  ["cohorts", "Promotions", "👥"], ["tickets", "Tickets", "🎟"], ["posts", "Publications", "📰"],
  ["users", "Utilisateurs", "👤"], ["reports", "Signalements", "⚑"], ["services", "Services", "🧩"],
  ["home", "Annonce accueil", "📣"], ["videos", "Vidéos", "🎬"], ["homemgr", "Page d'accueil", "🏠"],
  ["finance", "Trésorerie", "💰"], ["catalog", "Catalogue formations", "📚"],
].map(([key, title, icon]) => ({ key, title, icon, sub: "Ouvrir" }));

export function AdminHub(props) {
  return <Hub items={ADMIN_ITEMS} renderOption={(key) => <AdminSpace {...props} initialTab={key} hideTabs />} />;
}

export function TrainerHub(props) {
  const items = [
    { key: "cohorts", title: "Promotions", icon: "👥", sub: "Suivi, exercices, présence" },
    { key: "portfolios", title: "Réalisations", icon: "🗂", sub: "Portfolios des apprenants" },
  ];
  return <Hub items={items} renderOption={(key) => (key === "portfolios" ? <PortfolioStaff /> : <ParcoursManager {...props} />)} />;
}

export function CoordHub(props) {
  const items = [
    { key: "status", title: "État de l'application", icon: "⏻", sub: "Ouverture et maintenance" },
    { key: "users", title: "Gestion des comptes", icon: "🛡", sub: "Rôles, blocage, suppression" },
  ];
  return <Hub items={items} renderOption={(key) => <CoordinatorPanel {...props} view={key} />} />;
}
