import { useEffect, useState } from "react";
import Icon from "./icons.jsx";
import { imageUrl, imageMeta } from "./imageCatalog.js";

/* ---------- Utilitaires ---------- */

export function formatPrice(price) {
  if (price === null || price === undefined) return "Prix à confirmer";
  return `${Number(price).toLocaleString("fr-FR")} FCFA`;
}

export function getInitials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "ED";
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
}

export function roleLabel(role) {
  return { admin: "Administrateur", trainer: "Formateur", apprenant: "Apprenant" }[role] || "Membre";
}

export function formatDate(value, options = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR", options);
}

export function isMissingTableError(error) {
  return Boolean(error) && ["42P01", "PGRST205", "PGRST204"].includes(error.code);
}

/* ---------- Image avec dimensions d'origine ---------- */

/**
 * Affiche une image du bucket Supabase en réservant son rapport largeur/hauteur
 * d'origine (catalogue imageCatalog.js). Si le fichier est absent, un visuel de
 * remplacement aux mêmes proportions est affiché : jamais d'icône cassée.
 */
export function Img({ name, alt = "", className = "", eager = false, ...rest }) {
  const meta = imageMeta(name);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [name]);
  if (failed || !name) {
    return (
      <span
        className={`img-fallback ${className}`.trim()}
        style={meta ? { aspectRatio: `${meta.w} / ${meta.h}` } : undefined}
        role="img"
        aria-label={alt || "Visuel indisponible"}
      >
        <Icon name="image" size={28} />
      </span>
    );
  }
  return (
    <img
      src={imageUrl(name)}
      alt={alt}
      width={meta?.w || undefined}
      height={meta?.h || undefined}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

/** Cadre qui respecte exactement le rapport de l'image (fit="contain" : aucune découpe). */
export function Media({ name, alt = "", fit = "cover", className = "", ratio, eager = false }) {
  const meta = imageMeta(name);
  const aspect = ratio || (meta ? `${meta.w} / ${meta.h}` : "4 / 3");
  return (
    <figure className={`media media-${fit} ${className}`.trim()} style={{ aspectRatio: aspect }}>
      <Img name={name} alt={alt} eager={eager} className="media-img" />
    </figure>
  );
}

/* ---------- Avatar à taille standard ---------- */

const ROLE_AVATARS = {
  admin: "avatar-default-administrateur.png",
  trainer: "avatar-default-formatrice.png",
  apprenant: "avatar-default-apprenant.png",
  client: "avatar-default-client.png",
};

/** Tailles standard : xs 32 · sm 40 · md 56 · lg 96 · xl 128 px (cercle, recadrage centré). */
export function Avatar({ user, role = "client", size = "md", ring = false, className = "" }) {
  const name = user?.full_name || user?.name || user?.email || "Utilisateur";
  const photo = user?.avatar_url || user?.profile_photo || user?.photo_url || "";
  const [photoFailed, setPhotoFailed] = useState(false);
  const [defaultFailed, setDefaultFailed] = useState(false);
  useEffect(() => { setPhotoFailed(false); setDefaultFailed(false); }, [photo, role]);
  const fallbackName = ROLE_AVATARS[role] || ROLE_AVATARS.client;
  const src = photo && !photoFailed ? photo : !defaultFailed ? imageUrl(fallbackName) : "";
  return (
    <span className={`avatar avatar-${size} ${ring ? "avatar-ring" : ""} ${className}`.trim()} title={name}>
      {src ? (
        <img
          src={src}
          alt={`Photo de profil de ${name}`}
          width="512"
          height="512"
          loading="lazy"
          onError={() => (photo && !photoFailed ? setPhotoFailed(true) : setDefaultFailed(true))}
        />
      ) : (
        <span className="avatar-initials" aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
}

export function RoleBadge({ role }) {
  if (!role || role === "client") return null;
  return (
    <span className={`role-badge role-${role}`}>
      <Icon name="check" size={12} strokeWidth={3} />
      {roleLabel(role)}
    </span>
  );
}

/* ---------- Structure ---------- */

export function SectionHead({ eyebrow, title, accent, text, align = "center", light = false }) {
  return (
    <header className={`section-head align-${align} ${light ? "is-light" : ""}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>
        {title} {accent && <span className="grad-text">{accent}</span>}
      </h2>
      {text && <p>{text}</p>}
    </header>
  );
}

export function PageHero({ eyebrow, title, accent, text, image, imageFit = "contain", children, compact = false }) {
  return (
    <section className={`page-hero ${compact ? "is-compact" : ""}`}>
      <div className="container page-hero-inner">
        <div className="page-hero-copy">
          {eyebrow && <span className="eyebrow on-dark">{eyebrow}</span>}
          <h1>
            {title} {accent && <span className="grad-text-light">{accent}</span>}
          </h1>
          {text && <p>{text}</p>}
          {children && <div className="page-hero-actions">{children}</div>}
        </div>
        {image && (
          <div className="page-hero-visual">
            <Media name={image} fit={imageFit} alt="" className="glass-frame" eager />
          </div>
        )}
      </div>
    </section>
  );
}

export function EmptyState({ image, title, text, children }) {
  return (
    <div className="empty-state">
      {image && <Img name={image} alt="" className="empty-state-img" />}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Modal({ onClose, title, children, wide = false, labelledBy = "modal-title" }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
          <Icon name="x" size={20} />
        </button>
        {title && <h2 id={labelledBy} className="modal-title">{title}</h2>}
        {children}
      </section>
    </div>
  );
}

export function Spinner({ label = "Chargement…" }) {
  return (
    <div className="spinner-block" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
