export function AuthorAvatar({ card }) {
  if (card?.avatar_url) return <img className="publication-avatar" src={card.avatar_url} alt="" loading="lazy" />;
  return <div className="publication-avatar">{(card?.full_name || "ED").trim().slice(0, 2).toUpperCase()}</div>;
}

export function AuthorBadge({ card }) {
  if (!card) return null;
  return (
    <>
      {card.verified && (
        <span className="verified-badge" title="Profil vérifié">
          <span className="verified-badge-icon">✓</span>Vérifié
        </span>
      )}
      {card.active && !card.verified && (
        <span className="active-badge" title="100 points ou plus">★ Membre actif</span>
      )}
    </>
  );
}
