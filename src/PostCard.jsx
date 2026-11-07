import { useState } from "react";
import "./post-card.css";

// Publication façon Instagram : en-tête avec ⋯, image, cœur, bulle commentaire, légende
export default function PostCard({ post, focusKey, liked, likeCount, commentCount, isOwn, sendingLike, onLike, onDelete, onReport, author, attachments, comments, form }) {
  const [menu, setMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  return (
    <article className="ig-post" data-focus={focusKey}>
      <div className="ig-head">
        {author}
        <button type="button" className="ig-dots" aria-label="Options" onClick={() => setMenu(true)}>⋯</button>
      </div>
      {post.image_url && <img className="ig-img" src={post.image_url} alt={post.title || "Publication"} loading="lazy" />}
      {attachments}
      <div className="ig-bar">
        <button type="button" className={liked ? "ig-ico ig-like on" : "ig-ico ig-like"} disabled={sendingLike} onClick={onLike} aria-label="J'aime">{liked ? "♥" : "♡"}</button>
        <button type="button" className="ig-ico" aria-label="Commentaires" onClick={() => setShowComments(!showComments)}>💬</button>
      </div>
      <div className="ig-likes">{likeCount} J'aime</div>
      {post.title && <h3 className="ig-title">{post.title}</h3>}
      {post.body && <p className="ig-caption">{post.body}</p>}
      {commentCount > 0 && <button type="button" className="ig-more" onClick={() => setShowComments(!showComments)}>{showComments ? "Masquer les commentaires" : `Voir les ${commentCount} commentaire(s)`}</button>}
      {showComments && <div className="ig-comments">{comments}{form}</div>}
      {menu && (
        <div className="ig-sheet-back" role="presentation" onClick={() => setMenu(false)}>
          <div className="ig-sheet" onClick={(e) => e.stopPropagation()}>
            {isOwn && <button type="button" className="ig-sheet-item danger" onClick={() => { setMenu(false); onDelete(); }}>Supprimer la publication</button>}
            {!isOwn && <button type="button" className="ig-sheet-item" onClick={() => { setMenu(false); onReport(); }}>Signaler</button>}
            <button type="button" className="ig-sheet-item" onClick={() => setMenu(false)}>Annuler</button>
          </div>
        </div>
      )}
    </article>
  );
}
