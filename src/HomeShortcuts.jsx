import "./home-shortcuts.css";

// Raccourcis de l'accueil : Accueil, Services, Formations, Communauté, Emploi, Mon espace
const ITEMS = [
  { page: "home", label: "Accueil", icon: "⌂" },
  { page: "services", label: "Services", icon: "◈" },
  { page: "courses", label: "Formations", icon: "▤" },
  { page: "community", label: "Communauté", icon: "◎" },
  { page: "jobs", label: "Emploi", icon: "⌘" },
  { page: "account", label: "Mon espace", icon: "◉" },
];

export default function HomeShortcuts({ onNavigate }) {
  return (
    <nav className="home-shortcuts" aria-label="Raccourcis">
      {ITEMS.map((it) => (
        <button key={it.page} type="button" className="home-shortcut" onClick={() => onNavigate(it.page)}>
          <span className="home-shortcut-icon" aria-hidden="true">{it.icon}</span>
          <small>{it.label}</small>
        </button>
      ))}
    </nav>
  );
}
