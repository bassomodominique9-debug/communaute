import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./design.css";

// Navigation inférieure fixe (mobile). Pages : home, services, courses, community, account.
const ITEMS = [
  { page: "home", label: "Accueil", icon: "⌂" },
  { page: "services", label: "Services", icon: "◈" },
  { page: "courses", label: "Formations", icon: "▤" },
  { page: "community", label: "Communauté", icon: "◎" },
  { page: "jobs", label: "Emploi", icon: "⌘" },
  { page: "account", label: "Mon espace", icon: "◉" },
];

export function BottomNav({ activePage }) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {ITEMS.map((it) => (
        <button
          key={it.page}
          type="button"
          className={activePage === it.page ? "bottom-nav-item bottom-nav-on" : "bottom-nav-item"}
          aria-current={activePage === it.page ? "page" : undefined}
          onClick={() => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: it.page }))}
        >
          <span aria-hidden="true" className="bottom-nav-icon">{it.icon}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// Cloche de notifications : nombre de notifications non lues
export function BellButton() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      const { count: n, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
      if (active && !error) setCount(n || 0);
    }
    load();
    const timer = setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return (
    <button type="button" className="bell-button" aria-label={`Notifications${count ? `, ${count} non lue(s)` : ""}`}
      onClick={() => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: "notifications" }))}>
      <span aria-hidden="true">🔔</span>
      {count > 0 && <span className="bell-badge">{count > 99 ? "99+" : count}</span>}
    </button>
  );
}

// Menu secondaire : Contact, Assistance, Paramètres, Déconnexion
export function SecondaryMenu() {
  const [open, setOpen] = useState(false);
  const go = (page) => { setOpen(false); window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page })); };
  async function logout() {
    setOpen(false);
    await supabase.auth.signOut();
    window.location.reload();
  }
  return (
    <>
      <button type="button" className="secondary-menu-button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)}>⋯</button>
      {open && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="sheet-item" onClick={() => go("news")}>📰 Actualités</button>
            <button type="button" className="sheet-item" onClick={() => go("atelier")}>🧭 Ateliers</button>
            <button type="button" className="sheet-item" onClick={() => go("messages")}>✉ Messagerie</button>
            <button type="button" className="sheet-item" onClick={() => go("notifications")}>🔔 Notifications</button>
            <button type="button" className="sheet-item" onClick={() => go("contact")}>☎ Contact</button>
            <button type="button" className="sheet-item" onClick={() => go("contact")}>? Assistance</button>
            <button type="button" className="sheet-item" onClick={() => go("referral")}>🎁 Parrainage</button>
            <button type="button" className="sheet-item" onClick={() => go("account")}>⚙ Paramètres</button>
            <button type="button" className="sheet-item sheet-danger" onClick={logout}>⎋ Déconnexion</button>
          </div>
        </div>
      )}
    </>
  );
}
