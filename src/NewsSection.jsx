import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AttachmentList, AttachmentPicker } from "./Attachments";
import { imageUrl } from "./imageCatalog";

const asset = (name) => imageUrl(name);

export default function NewsSection({ user, role, onNotify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data, error } = await supabase.from("publications")
        .select("id, title, body, image_url, attachments, created_at")
        .eq("is_published", true).eq("category", "news")
        .order("created_at", { ascending: false });
      if (!alive) return;
      if (error) {
        console.error("Chargement des actualités :", error.message);
        onNotify?.("Les actualités nécessitent la migration Supabase prévue pour cette mise à jour.");
        setItems([]);
      } else setItems(data || []);
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  // La fonction de notification est volontairement omise des dépendances : elle est recréée par App à chaque rendu.
  }, []);

  async function publishNews(event) {
    event.preventDefault();
    if (!user || !["admin", "trainer"].includes(role)) return;
    if (!title.trim() || !body.trim()) { onNotify?.("Renseigne le titre et le contenu de l'actualité."); return; }
    setPublishing(true);
    const { error } = await supabase.from("publications").insert({
      title: title.trim(), body: body.trim(), image_url: (files.find((f) => f.type === "image") || {}).url || null,
      attachments: files.filter((f) => f !== files.find((x) => x.type === "image")),
      author_id: user.id, category: "news", is_published: true,
    });
    setPublishing(false);
    if (error) { console.error("Publication actualité :", error.message); onNotify?.("Impossible de publier l'actualité. Vérifie les autorisations Supabase."); return; }
    setTitle(""); setBody(""); setFiles([]);
    onNotify?.("Actualité publiée.");
    const { data } = await supabase.from("publications").select("id, title, body, image_url, attachments, created_at").eq("is_published", true).eq("category", "news").order("created_at", { ascending: false });
    setItems(data || []);
  }

  return <section className="news-section section-container">
    <div className="news-hero"><img src={asset("interface-actualites.png")} alt="Espace Actualités ED BUSINESS CENTER" /><div><span className="eyebrow">INFORMATIONS OFFICIELLES</span><h1>Actualités ED BUSINESS CENTER</h1><p>Retrouve ici les nouveautés, annonces et informations utiles publiées par ED BUSINESS CENTER.</p></div></div>
    <article className="news-guide"><img src={asset("publication-actualites-01-comprendre-les-actualites.png")} alt="Comprendre les actualités" /><div><span className="eyebrow">COMMENT UTILISER CET ESPACE</span><h2>Reste informé en quelques étapes</h2><p>Consulte les titres, lis les informations et vérifie les dates de publication pour suivre les nouveautés et annonces importantes.</p></div></article>
    {(role === "admin" || role === "trainer") && <form className="news-publish-form" onSubmit={publishNews}><span className="eyebrow">ESPACE ÉQUIPE AUTORISÉE</span><h2>Publier une actualité</h2><label>Titre<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={180} /></label><label>Contenu<textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={5000} rows={4} /></label><AttachmentPicker user={user} value={files} onChange={setFiles} full onNotify={onNotify} /><button className="button button-primary" type="submit" disabled={publishing}>{publishing ? "Publication…" : "Publier l'actualité"}</button></form>}
    <div className="atelier-section-heading"><div><span className="eyebrow">DERNIÈRES INFORMATIONS</span><h2>Les dernières actualités</h2></div></div>
    {loading ? <div className="community-empty">Chargement des actualités…</div> : items.length === 0 ? <div className="community-empty"><img src={asset("illustration-aucun-resultat.png")} alt="Aucune actualité pour le moment" loading="lazy" /><h2>Aucune actualité publiée pour le moment</h2><p>Les prochaines informations apparaîtront ici.</p></div> : <div className="news-card-grid">{items.map((item) => <article className="news-card" key={item.id}>{item.image_url && <img src={item.image_url} alt={item.title || "Actualité"} loading="lazy" />}<div><small>{new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</small> <span className="verified-badge"><span className="verified-badge-icon">✓</span>ED BUSINESS CENTER</span><h3>{item.title}</h3><p>{item.body}</p><AttachmentList items={item.attachments} /></div></article>)}</div>}
  </section>;
}
