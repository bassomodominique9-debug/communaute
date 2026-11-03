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
