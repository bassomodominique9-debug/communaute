import { AuthorAvatar, AuthorBadge } from "./AuthorBadge";
import PostCard from "./PostCard";
import "./community-lot1.css";
import ReportDialog from "./ReportDialog";
import { AttachmentList, AttachmentPicker } from "./Attachments";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { imageUrl } from "./imageCatalog";

function CommunitySection({ user, profile, role, onNotify, onPointsUpdated }) {
  const [files, setFiles] = useState([]);
  const isStaff = role === "admin" || role === "trainer";
  const [posts, setPosts] = useState([]);
  const [reporting, setReporting] = useState(null);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  const openComposer = () => {
    setComposerOpen(true);
    setTimeout(() => {
      const form = document.querySelector(".community-create-form");
      if (!form) return;
      const rect = form.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.4) form.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const field = form.querySelector("input, textarea");
      if (field) field.focus({ preventScroll: true });
    }, 60);
  };
  const [newBody, setNewBody] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("publications")
      .select("id, title, body, image_url, attachments, created_at, author_id")
      .eq("is_published", true)
      .eq("category", "community")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Chargement des actualités :", error.message);
      onNotify?.("Les actualités ne sont pas encore configurées dans Supabase.");
      setPosts([]);
    } else {
      const ids = (data || []).map((p) => p.id);
      let reactions = [];
      if (ids.length) {
        const result = await supabase.from("publication_interactions").select("publication_id, user_id, interaction_type, content, created_at").in("publication_id", ids);
        if (!result.error) reactions = result.data || [];
      }
      let cards = {};
      const authorIds = [...new Set([...(data || []).map((p) => p.author_id), ...reactions.filter((r) => r.interaction_type === "comment").map((r) => r.user_id)].filter(Boolean))];
      if (authorIds.length) {
        const cardResult = await supabase.rpc("get_author_cards", { p_ids: authorIds });
        if (!cardResult.error && Array.isArray(cardResult.data)) {
          cards = Object.fromEntries(cardResult.data.map((c) => [c.id, c]));
        }
      }
      setPosts((data || []).map((post) => ({
        ...post,
        author: cards[post.author_id] || null,
        cards,
        interactions: reactions.filter((r) => r.publication_id === post.id),
      })));
    }
    setLoading(false);
  }

  useEffect(() => { loadPosts(); }, []);


  async function createPost(event) {
    event.preventDefault();
    if (!user) { onNotify?.("Connecte-toi pour publier."); return; }
    if (!newBody.trim()) { onNotify?.("Écris le contenu de ta publication."); return; }
    setCreating(true);
    const { error } = await supabase.from("publications").insert({
      title: newTitle.trim() || null,
      body: newBody.trim(),
      image_url: (files.find((f) => f.type === "image") || {}).url || null,
      attachments: files.filter((f, i) => !(f.type === "image" && f === files.find((x) => x.type === "image"))),
      author_id: user.id,
      category: "community",
      is_published: true,
    });
    setCreating(false);
    if (error) {
      console.error("Création publication :", error.message);
      onNotify?.("Impossible de publier. Vérifie la migration et les autorisations Supabase.");
      return;
    }
    setNewTitle(""); setNewBody(""); setNewImageUrl(""); setComposerOpen(false);
    onNotify?.("Publication ajoutée à la communauté.");
    await loadPosts();
  }

  async function deletePost(post) {
    if (!user || post.author_id !== user.id) return;
    if (!window.confirm("Supprimer ta publication ? Cette action est définitive.")) return;
    const { error } = await supabase.from("publications").delete().eq("id", post.id).eq("author_id", user.id);
    if (error) { onNotify?.("Impossible de supprimer cette publication."); return; }
    onNotify?.("Publication supprimée.");
    await loadPosts();
  }

  async function interact(postId, type) {
    if (!user) { onNotify?.("Connecte-toi pour interagir avec une publication."); return; }
    const content = type === "comment" ? (comments[postId] || "").trim() : null;
    if (type === "comment" && !content) { onNotify?.("Écris un commentaire avant de l’envoyer."); return; }
    setSending(postId + type);
    const { data, error } = await supabase.rpc("interact_with_publication", {
      p_publication_id: postId, p_interaction_type: type, p_content: content,
    });
    setSending(null);
    if (error) {
      console.error("Interaction publication :", error.message);
      onNotify?.("Impossible d’enregistrer l’action. Vérifie que le SQL de la communauté est installé.");
      return;
    }
    if (data?.points_awarded) {
      onPointsUpdated?.(Number(data.total_points ?? profile?.points ?? 0));
      onNotify?.("Bravo ! Tu gagnes 1 point pour cette publication.");
    } else {
      onNotify?.(type === "like" ? "J’aime enregistré. Tu as déjà gagné ton point pour cette publication." : "Commentaire enregistré. Tu as déjà gagné ton point pour cette publication.");
    }
    setComments((prev) => ({ ...prev, [postId]: "" }));
    await loadPosts();
  }

  return (
    <section className="community-section section-container">
      <div className="community-heading">
        <div><span className="eyebrow">LA COMMUNAUTÉ ED B-CENTER</span><h1>Communauté</h1><p>Découvre les publications, réagis et échange avec les autres membres.</p></div>
        <div className="community-points" title="Ton total de points"><span>★</span><strong>{Number(profile?.points || 0)}</strong><small>POINTS</small></div>
      </div>
      {user && !composerOpen && (
        <div className="composer-bar">
          <button type="button" className="composer-input" onClick={openComposer}>Publier dans la communauté…</button>
          <button type="button" className="composer-photo" aria-label="Importer une photo" onClick={openComposer}>📷</button>
        </div>
      )}
      {!user && <p className="composer-login">Connecte-toi pour publier dans la communauté.</p>}
      {user && composerOpen && <form className="community-create-form" onSubmit={createPost}><button type="button" className="composer-close" onClick={() => setComposerOpen(false)}>Fermer</button><h2>Partager avec la communauté</h2><label>Titre (facultatif)<input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={180} placeholder="Le titre de ta publication" /></label><label>Ton message<textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} required maxLength={5000} rows={4} placeholder="Partage une idée, une expérience ou une question…" /></label><AttachmentPicker user={user} value={files} onChange={setFiles} full={isStaff} onNotify={onNotify} /><button className="button button-primary" type="submit" disabled={creating}>{creating ? "Publication…" : "Publier"}</button></form>}
      <img className="community-interface-preview" src={imageUrl("banniere-communaute-ed-b-center.png")} alt="Aperçu de l'espace Communauté" loading="lazy" />
      <div className="points-explainer">★ Une publication = un point maximum par compte. Aimer et commenter la même publication ne donne pas de deuxième point.</div>
      <div className="community-guides">
        <article><img src={imageUrl("publication-communaute-01-decouvrir-la-communaute.png")} alt="Découvrir la communauté" loading="lazy"/><h2>Découvrir la communauté</h2><p>Consulte les publications partagées dans cet espace.</p></article>
        <article><img src={imageUrl("publication-communaute-02-interagir-et-commenter.png")} alt="Interagir et commenter" loading="lazy"/><h2>Interagir et commenter</h2><p>Connecte-toi pour aimer une publication ou ajouter un commentaire.</p></article>
        <article><img src={imageUrl("publication-communaute-03-profils-et-abonnements.png")} alt="Profils et abonnements" loading="lazy"/><h2>Découvrir les membres</h2><p>Explore les profils publics et les possibilités de suivi disponibles.</p></article>
      </div>

      {loading ? <div className="community-empty">Chargement des publications…</div> : posts.length === 0 ? (
        <div className="community-empty"><img src={imageUrl("illustration-conversation-vide.png")} alt="Aucune publication pour le moment" loading="lazy" /><h2>Aucune publication pour le moment</h2><p>Les publications publiées par l’équipe apparaîtront ici.</p></div>
      ) : <div className="publication-list">{posts.map((post) => {
        const interactions = post.interactions || [];
        const liked = interactions.some((r) => r.user_id === user?.id && r.interaction_type === "like");
        const postComments = interactions.filter((r) => r.interaction_type === "comment");
        return <PostCard key={post.id} focusKey={`publication:${post.id}`} post={post} liked={liked} likeCount={interactions.filter((r) => r.interaction_type === "like").length} commentCount={postComments.length} isOwn={post.author_id === user?.id} sendingLike={sending === post.id + "like"} onLike={() => interact(post.id, "like")} onDelete={() => deletePost(post)} onReport={() => setReporting(post)} author={<><div className="publication-author" style={{ cursor: user ? "pointer" : "default" }} role="button" tabIndex={0} onClick={() => { if (!user) return; if (!post.author_id) { onNotify?.("Cette ancienne publication n'a pas d'auteur lié."); return; } window.dispatchEvent(new CustomEvent("ed-open-profile", { detail: post.author_id })); }}><AuthorAvatar card={post.author} /><div><strong>{post.author?.full_name || "ED BUSINESS CENTER"}</strong><AuthorBadge card={post.author} /><small>{new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</small></div></div></>} attachments={<AttachmentList items={post.attachments} />} comments={<>{postComments.map((c) => <div className="publication-comment" key={`${c.user_id}-${c.created_at}-${c.content}`}><strong style={c.user_id === user?.id ? undefined : { cursor: "pointer" }} onClick={() => c.user_id !== user?.id && window.dispatchEvent(new CustomEvent("ed-open-profile", { detail: c.user_id }))}>{c.user_id === user?.id ? "Vous" : (post.cards?.[c.user_id]?.full_name || "Membre")}</strong><p>{c.content}</p></div>)}</>} form={<><form className="publication-comment-form" onSubmit={(e) => { e.preventDefault(); interact(post.id, "comment"); }}><input id={`comment-${post.id}`} value={comments[post.id] || ""} onChange={(e) => setComments((prev) => ({ ...prev, [post.id]: e.target.value }))} placeholder="Écrire un commentaire…" maxLength={1000}/><button className="button button-primary" disabled={sending === post.id + "comment"}>Envoyer</button></form></>} />;
      })}</div>}
    </section>
  );
}
export default CommunitySection;
