import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import WorkshopReservationsAdmin from "./WorkshopReservationsAdmin";
import { ServiceManager } from "./Step2";
import AnnouncementEditor from "./AnnouncementEditor";
import VideoManager from "./VideoManager";
import HomeManager from "./HomeManager";
import FinanceManager from "./FinanceManager";
import CatalogManager from "./CatalogManager";
import JobsAdmin from "./JobsAdmin";
import ModerationManager from "./ModerationManager";
import { PhotoAdmin } from "./CatalogPhoto";
import AdminReferral from "./AdminReferral";
import { CatalogAdmin } from "./CatalogPages";
import MediaManager from "./MediaManager";
import PriceManager from "./PriceManager";
import CohortAdmin from "./CohortAdmin";
import RegPayment from "./RegPayment";

const TABS = [
  ["stats", "Tableau de bord"], ["formations", "Formations"], ["prices", "Prix"], ["cohorts", "Promotions"], ["tickets", "Tickets"],
  ["posts", "Publications"], ["users", "Utilisateurs"], ["reports", "Signalements"], ["services", "Services"], ["home", "Annonce accueil"], ["videos", "Vidéos"], ["homemgr", "Page d'accueil"], ["finance", "Trésorerie"], ["catalog", "Catalogue formations"], ["emploi", "Emploi"], ["moderation", "Modération"], ["photoadmin", "Photo : tarifs & commandes"], ["referral", "Parrainage"], ["catalogs2", "Catalogues & devis"], ["media", "Médiathèque"], ["annonce", "Notification"],
];
const STATUS = { new: "Nouvelle", contacted: "Contactée", enrolled: "Inscrite", cancelled: "Annulée" };
const missing = "Installe le SQL « partie 9 » dans Supabase.";

export default function AdminSpace({ user, catalog, onNotify }) {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [regs, setRegs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const fail = (error) => onNotify?.(error.message?.includes("function") ? missing : error.message);

  const load = useCallback(async (which) => {
    if (which === "stats") {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) fail(error); else setStats(data);
    } else if (which === "formations") {
      const { data, error } = await supabase.from("course_registrations").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) fail(error); else setRegs(data || []);
    } else if (which === "posts") {
      const { data, error } = await supabase.from("publications").select("id, title, body, category, is_published, created_at").order("created_at", { ascending: false }).limit(60);
      if (error) fail(error); else setPosts(data || []);
    } else if (which === "reports") {
      const { data, error } = await supabase.rpc("staff_list_reports");
      if (error) fail(error); else setReports(Array.isArray(data) ? data : []);
    } else if (which === "users") {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) fail(error); else setUsers(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  async function setRegStatus(id, status) {
    const { error } = await supabase.from("course_registrations").update({ status }).eq("id", id);
    if (error) fail(error); else load("formations");
  }
  async function resolveReport(report, hide) {
    const { error } = await supabase.rpc("staff_resolve_report", { p_report_id: report.id, p_hide: hide });
    if (error) fail(error); else { onNotify?.(hide ? "Publication masquée." : "Signalement ignoré."); load("reports"); }
  }
  async function togglePost(post) {
    const { error } = await supabase.from("publications").update({ is_published: !post.is_published }).eq("id", post.id);
    if (error) fail(error); else load("posts");
  }
  async function removePost(post) {
    if (!window.confirm("Supprimer définitivement cette publication ?")) return;
    const { error } = await supabase.from("publications").delete().eq("id", post.id);
    if (error) fail(error); else load("posts");
  }
  async function sendAnnouncement(event) {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_notify_all", { p_title: title.trim(), p_body: body.trim() });
    setBusy(false);
    if (error) { fail(error); return; }
    setTitle(""); setBody("");
    onNotify?.(`Annonce envoyée à ${data?.sent_to ?? 0} membres.`);
  }

  const shownUsers = users.filter((u) => `${u.full_name} ${u.email} ${u.phone}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="account-tab-content admin-space">
      <div className="account-section-title">
        <div><span className="eyebrow">GESTION DE LA PLATEFORME</span><h2>Administration</h2></div>
      </div>
      <div className="admin-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "stats" && (
        <div className="account-stat-grid">
          {[["members", "Membres"], ["posts", "Publications"], ["workshops", "Ateliers publiés"], ["pending_tickets", "Tickets à valider"], ["new_registrations", "Inscriptions formations"], ["messages", "Messages échangés"]].map(([key, label]) => (
            <div className="account-stat-card" key={key}><div><span className="account-stat-label">{label}</span><strong>{stats ? stats[key] : "…"}</strong></div></div>
          ))}
        </div>
      )}

      {tab === "formations" && (
        <div className="account-content-card">
          <h3>Inscriptions aux formations</h3>
          {regs.length === 0 && <p>Aucune inscription pour le moment.</p>}
          {regs.map((r) => (
            <div className="admin-row" key={r.id}>
              <div>
                <strong>{r.full_name}</strong> — {r.course_title}
                <p><a href={`tel:${r.phone}`}>{r.phone}</a>{r.email ? ` · ${r.email}` : ""}</p>
                {r.message && <p>{r.message}</p>}
                <RegPayment reg={r} onDone={() => load("formations")} onNotify={onNotify} />
                <small>{new Date(r.created_at).toLocaleString("fr-FR")}</small>
              </div>
              <select value={r.status} onChange={(e) => setRegStatus(r.id, e.target.value)} aria-label="Statut">
                {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "tickets" && <WorkshopReservationsAdmin onNotify={onNotify} />}

      {tab === "cohorts" && <CohortAdmin onNotify={onNotify} />}

      {tab === "prices" && catalog && <PriceManager catalog={catalog} onNotify={onNotify} />}

      {tab === "posts" && (
        <div className="account-content-card">
          <h3>Modérer les publications</h3>
          {posts.length === 0 && <p>Aucune publication.</p>}
          {posts.map((p) => (
            <div className="admin-row" key={p.id}>
              <div>
                <strong>{p.title || "Sans titre"}</strong> <small>({p.category === "news" ? "actualité" : "communauté"}{p.is_published ? "" : ", masquée"})</small>
                <p>{(p.body || "").slice(0, 140)}</p>
              </div>
              <div className="admin-row-actions">
                <button type="button" className="button button-outline" onClick={() => togglePost(p)}>{p.is_published ? "Masquer" : "Afficher"}</button>
                <button type="button" className="button button-danger" onClick={() => removePost(p)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="account-content-card">
          <h3>Membres ({users.length})</h3>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un nom, un e-mail, un téléphone" />
          {shownUsers.map((u) => (
            <div className="admin-row" key={u.id}>
              <div><strong>{u.full_name || "Membre"}</strong> <small>({u.role})</small><p>{u.email}{u.phone ? ` · ${u.phone}` : ""}</p></div>
              <span className="header-points">★ {u.points}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="account-content-card">
          <h3>Publications signalées</h3>
          {reports.length === 0 && <p>Aucun signalement en attente.</p>}
          {reports.map((r) => (
            <div className="admin-row" key={r.id}>
              <div>
                <strong>{r.title || "Sans titre"}</strong> <small>({r.reason})</small>
                <p>{(r.body || "").slice(0, 160)}</p>
                {r.details && <p><i>« {r.details} »</i></p>}
              </div>
              <div className="admin-row-actions">
                <button type="button" className="button button-danger" onClick={() => resolveReport(r, true)}>Masquer</button>
                <button type="button" className="button button-outline" onClick={() => resolveReport(r, false)}>Ignorer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "services" && <ServiceManager onNotify={onNotify} />}

      {tab === "home" && <AnnouncementEditor user={user} onNotify={onNotify} />}

      {tab === "videos" && <VideoManager user={user} onNotify={onNotify} />}

      {tab === "homemgr" && <HomeManager user={user} onNotify={onNotify} />}

      {tab === "finance" && <FinanceManager onNotify={onNotify} />}

      {tab === "catalog" && <CatalogManager onNotify={onNotify} />}

      {tab === "emploi" && <JobsAdmin onNotify={onNotify} />}

      {tab === "moderation" && <ModerationManager onNotify={onNotify} />}

      {tab === "photoadmin" && <PhotoAdmin onNotify={onNotify} />}

      {tab === "referral" && <AdminReferral onNotify={onNotify} />}

      {tab === "catalogs2" && <CatalogAdmin onNotify={onNotify} />}

      {tab === "media" && <MediaManager user={user} onNotify={onNotify} />}

      {tab === "annonce" && (
        <form className="account-content-card" onSubmit={sendAnnouncement}>
          <h3>Annonce à tous les membres</h3>
          <p>Chaque membre reçoit une notification.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" required maxLength={80} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" required rows={4} maxLength={300} />
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Envoi…" : "Envoyer à tous"}</button>
        </form>
      )}
    </div>
  );
}
