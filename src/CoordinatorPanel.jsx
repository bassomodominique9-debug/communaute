import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { imageUrl } from "./imageCatalog";

export default function CoordinatorPanel({ onNotify, onStatusChange }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    setChecking(true);
    const { data, error } = await supabase.rpc("coordinator_get_control_state");
    if (error) {
      console.error("Contrôle coordinateur :", error.message);
      setAuthorized(false);
      setSettings(null);
      setChecking(false);
      return;
    }
    setAuthorized(Boolean(data?.authorized));
    setSettings(data?.settings || null);
    onStatusChange?.(Boolean(data?.settings?.maintenance_mode), data?.settings?.maintenance_message || "");
    setChecking(false);
  }

  async function loadUsers() {
    setLoadingUsers(true);
    const { data, error } = await supabase.rpc("coordinator_list_users");
    if (error) {
      onNotify?.("Impossible de charger les comptes. Vérifie les fonctions SQL du coordinateur.");
      console.error("Liste des comptes :", error.message);
    } else setUsers(Array.isArray(data) ? data : []);
    setLoadingUsers(false);
  }

  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (authorized) loadUsers(); }, [authorized]);

  async function runAction(action, payload = {}) {
    setBusy(action);
    const { data, error } = await supabase.rpc(action, payload);
    setBusy("");
    if (error) {
      console.error(`Action coordinateur ${action} :`, error.message);
      onNotify?.("Action refusée ou impossible. Vérifie les autorisations Supabase.");
      return false;
    }
    onNotify?.(data?.message || "Action effectuée.");
    await refresh();
    await loadUsers();
    return true;
  }

  async function updateRole(target, nextRole) {
    if (!window.confirm(`Confirmer l'attribution du rôle « ${nextRole} » à ${target.full_name || target.email || "ce compte"} ?`)) return;
    await runAction("coordinator_set_user_role", { p_target_user_id: target.id, p_new_role: nextRole });
  }

  async function toggleBan(target) {
    const banned = Boolean(target.is_banned);
    if (!window.confirm(`${banned ? "Réactiver" : "Bannir"} le compte ${target.full_name || target.email || target.id} ?`)) return;
    await runAction("coordinator_set_user_ban", { p_target_user_id: target.id, p_banned: !banned });
  }

  async function deleteUser(target) {
    const label = target.full_name || target.email || target.id;
    if (!window.confirm(`SUPPRESSION DÉFINITIVE : supprimer le compte ${label} et son accès ? Cette action est irréversible.`)) return;
    if (!window.confirm("Dernière confirmation : veux-tu réellement supprimer ce compte ?")) return;
    await runAction("coordinator_delete_user", { p_target_user_id: target.id });
  }

  if (checking) return <div className="coordinator-panel"><p>Vérification de l'accès coordinateur…</p></div>;
  if (!authorized) return <div className="coordinator-panel coordinator-denied"><img className="coordinator-empty-image" src={imageUrl("illustration-gestion-roles.png")} alt="Configuration des accès coordinateur" loading="lazy" /><h2>Accès coordinateur indisponible</h2><p>Cette interface est réservée au compte coordinateur principal configuré dans Supabase. Aucun pouvoir administratif n'est accordé par le simple affichage de cette page.</p></div>;

  return <section className="coordinator-panel">
    <div className="coordinator-heading"><span className="eyebrow">ACCÈS PRIVILÉGIÉ</span><h2>Centre de contrôle du coordinateur</h2><p>Les actions sensibles sont vérifiées par des fonctions sécurisées dans Supabase.</p></div>
    <div className="coordinator-status-grid"><article><span>État de l'application</span><strong>{settings?.maintenance_mode ? "Fermée" : "Ouverte"}</strong></article><article><span>Mode maintenance</span><strong>{settings?.maintenance_mode ? "Activé" : "Désactivé"}</strong></article></div>
    <div className="coordinator-action-row"><label htmlFor="maintenance-message">Message affiché aux utilisateurs</label><input id="maintenance-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={300} placeholder="APPLICATION FERMÉE — maintenance en cours"/><button type="button" className="button button-primary" disabled={Boolean(busy)} onClick={() => runAction("coordinator_set_maintenance", { p_enabled: !settings?.maintenance_mode, p_message: (message.trim() || "APPLICATION FERMÉE — maintenance en cours") })}>{busy ? "Traitement…" : settings?.maintenance_mode ? "Réouvrir l'application" : "Fermer l'application"}</button></div>
    <div className="coordinator-security-note"><strong>Limite de sécurité importante</strong><p>Le mode maintenance masque l'application côté interface. Il ne désactive pas à lui seul l'accès direct à Supabase ou aux dépôts GitHub. Les autorisations RLS, les clés et les accès aux comptes doivent rester protégés séparément.</p></div>
    <div className="coordinator-users-heading"><div><span className="eyebrow">COMPTES ET AUTORISATIONS</span><h3>Gestion des utilisateurs</h3></div><button type="button" className="button button-outline" onClick={loadUsers} disabled={loadingUsers}>{loadingUsers ? "Actualisation…" : "Actualiser"}</button></div>
    {loadingUsers && users.length === 0 ? <p>Chargement des comptes…</p> : users.length === 0 ? <p>Aucun compte à afficher ou la fonction SQL n'est pas disponible.</p> : <div className="coordinator-users-list">{users.map((item) => <article className="coordinator-user-card" key={item.id}><div className="coordinator-user-info"><strong>{item.full_name || "Utilisateur"}</strong><span>{item.email || item.id}</span><small>Rôle : {item.role || "client"} · {item.is_banned ? "Compte bloqué" : "Compte actif"}</small></div><div className="coordinator-user-actions"><label className="sr-only" htmlFor={`role-${item.id}`}>Rôle de {item.full_name || item.email}</label><select id={`role-${item.id}`} value={item.role || "client"} onChange={(event) => updateRole(item, event.target.value)} disabled={Boolean(busy) || item.is_coordinator}><option value="client">Client</option><option value="apprenant">Apprenant</option><option value="trainer">Formateur</option><option value="admin">Administrateur</option></select><button type="button" className="button button-outline" onClick={() => toggleBan(item)} disabled={Boolean(busy) || item.is_coordinator}>{item.is_banned ? "Réactiver" : "Bannir"}</button><button type="button" className="button button-danger" onClick={() => deleteUser(item)} disabled={Boolean(busy) || item.is_coordinator}>Supprimer</button></div></article>)}</div>}
    <p className="coordinator-footnote">Le compte coordinateur principal ne peut pas être modifié, banni ou supprimé depuis cette interface.</p>
  </section>;
}
