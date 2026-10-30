import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import PushToggle from "./PushToggle";
import { imageUrl } from "./imageCatalog";

function NotificationsSection({ user, onNotify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    const { data, error } = await supabase.from("notifications").select("id, title, body, created_at, read_at, link").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (error) { console.error("Notifications :", error.message); setItems([]); } else setItems(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); const channel = supabase.channel("user-notifications-" + user.id).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + user.id }, (payload) => { setItems((old) => [payload.new, ...old]); onNotify?.("Nouvelle notification : " + (payload.new.title || "mise à jour")); }).subscribe(); return () => { supabase.removeChannel(channel); }; }, [user.id]);
  async function markAllRead() { const now = new Date().toISOString(); const { error } = await supabase.from("notifications").update({ read_at: now }).eq("user_id", user.id).is("read_at", null); if (error) { onNotify?.(error.message); return; } setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now }))); onNotify?.("Toutes les notifications sont marquées comme lues."); }
  async function markRead(item) {
    if (item.link) window.dispatchEvent(new CustomEvent("ed-navigate", { detail: item.link })); const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", item.id).eq("user_id", user.id); if (error) { onNotify?.("Impossible de mettre à jour cette notification."); return; } setItems((old) => old.map((n) => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n)); }
  return <section className="notifications-section section-container">
      <PushToggle onNotify={onNotify} /><img className="notifications-feature-preview" src={imageUrl("interface-notifications.png")} alt="Aperçu du centre de notifications" loading="lazy"/><div className="community-heading"><div><span className="eyebrow">TON ESPACE</span><h1>Notifications</h1><p>Les informations importantes de ton compte, au même endroit.</p></div><span className="notification-total">{items.filter((n) => !n.read_at).length} non lue(s)</span>{items.some((n) => !n.read_at) && <button type="button" className="button button-outline notification-readall" onClick={markAllRead}>Tout marquer comme lu</button>}</div>{loading ? <div className="community-empty">Chargement des notifications…</div> : items.length === 0 ? <div className="community-empty"><img className="notifications-empty-image" src={imageUrl("illustration-notifications-vides.png")} alt="Aucune notification" loading="lazy"/><h2>Tu es à jour !</h2><p>Les nouvelles notifications apparaîtront ici.</p></div> : <div className="notification-list">{items.map((item) => <article className={`notification-card ${item.read_at ? "is-read" : "is-unread"}`} key={item.id}><span className="notification-symbol">♧</span><div className="notification-copy"><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("fr-FR")}</small>{!item.read_at && <button className="notification-mark" onClick={() => markRead(item)}>Marquer comme lue</button>}</div>{!item.read_at && <span className="notification-unread-dot"/>}</article>)}</div>}</section>;
}
export default NotificationsSection;
