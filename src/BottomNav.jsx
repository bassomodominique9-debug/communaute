import { createPortal } from "react-dom";
import AssistantChat from "./AssistantChat";
import "./menu-sheet.css";
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

import "./compact-app.css";

// Icônes de la barre du bas : trait fin, style Instagram
function NavIcon({ name }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  switch (name) {
    case "home": return <svg {...common}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>;
    case "services": return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "courses": return <svg {...common}><path d="M2 9l10-5 10 5-10 5-10-5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>;
    case "community": return <svg {...common}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>;
    case "jobs": return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2" /><path d="M3 12h18" /></svg>;
    case "account": return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>;
    default: return null;
  }
}

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
          <NavIcon name={it.page} />
          <span className="sr-only">{it.label}</span>
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

// Menu ⋯ : Déconnexion et Assistance, en petites lignes ; Assistance s'ouvre dans la même fenêtre
export function SecondaryMenu() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu");
  const [canComm, setCanComm] = useState(false);
  useEffect(() => { supabase.rpc("comm_my_access").then(({ data, error }) => setCanComm(!error && data === true)); }, []);
  const close = () => { setOpen(false); setView("menu"); };
  const go = (page) => { close(); window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page })); };
  async function logout() {
    close();
    await supabase.auth.signOut();
    window.location.reload();
  }
  return (
    <>
      <button type="button" className="secondary-menu-button" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)}>⋯</button>
      {open && createPortal(
        <div className="menu-backdrop" role="presentation" onClick={close}>
          <div className="menu-sheet" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-head">
              {view === "menu"
                ? <span className="menu-title">Menu</span>
                : <button type="button" className="menu-back" aria-label="Retour" onClick={() => setView("menu")}>‹</button>}
              <button type="button" className="menu-close" aria-label="Fermer" onClick={close}>×</button>
            </div>
            {view === "menu" && (
              <div className="menu-list">
                <button type="button" className="menu-row" onClick={logout}><span>⎋</span>Déconnexion</button>
                <button type="button" className="menu-row" onClick={() => setView("assistant")}><span>?</span>Assistance<i>›</i></button>
                {canComm && <button type="button" className="menu-row" onClick={() => go("communication")}><span>📣</span>Communication<i>›</i></button>}
              </div>
            )}
            {view === "assistant" && <AssistantChat inline />}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Icône messagerie dans la barre du haut : messages non lus, accessible depuis toutes les pages
export function MessageButton() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count: n, error } = await supabase.from("messages").select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id).is("read_at", null);
      if (active && !error) setCount(n || 0);
    }
    load();
    const timer = setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return (
    <button type="button" className="bell-button message-button" aria-label={`Messagerie${count ? `, ${count} non lu(s)` : ""}`}
      onClick={() => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: "messages" }))}>
      <span aria-hidden="true">✉</span>
      {count > 0 && <span className="bell-badge">{count > 99 ? "99+" : count}</span>}
    </button>
  );
}
