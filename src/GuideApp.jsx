import { useState } from "react";
import { createPortal } from "react-dom";
import "./guide.css";

// Guide « Comment utiliser l'application » : 5 pages, aperçu simplifié, ce que l'on voit et fait
const PAGES = [
  {
    title: "L'accueil",
    text: "Tu trouves ici les catalogues, les services et les ateliers. La carte « Premiers pas » t'aide à bien commencer.",
    preview: [["Catalogues", "tile"], ["Services", "tile"], ["Ateliers", "wide"]],
  },
  {
    title: "Services et formations",
    text: "Pour demander un devis, touche un service puis décris ton besoin. Pour une formation, touche-la puis S'inscrire. Ton espace apprenant se trouve dans Mon espace.",
    preview: [["Devis", "wide"], ["S'inscrire", "pill"]],
  },
  {
    title: "Ateliers et communauté",
    text: "Réserve un atelier, puis paie le ticket. Dans la communauté, touche « Publier » pour partager un message. Chaque publication donne un point.",
    preview: [["Réserver", "pill"], ["Publier dans la communauté", "wide"]],
  },
  {
    title: "Emploi",
    text: "Consulte les offres vérifiées et crée ton profil candidat. Les offres publiées par l'administration portent cette mention, avec un contact.",
    preview: [["Offre vérifiée", "tile"], ["Mon profil candidat", "wide"]],
  },
  {
    title: "Mon espace et l'assistance",
    text: "Mon espace regroupe tes demandes, tes messages et ton parrainage. Besoin d'aide ? Touche le menu ⋮, puis Assistance, sous Déconnexion.",
    preview: [["Messages", "tile"], ["Parrainage", "tile"], ["Assistance", "wide"]],
  },
];

export default function GuideApp() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const close = () => { setOpen(false); setPage(0); };
  const current = PAGES[page];

  return (
    <>
      <button type="button" className="guide-card" onClick={() => { setPage(0); setOpen(true); }}>
        <span className="guide-card-icon" aria-hidden="true">📖</span>
        <span><strong>Comment utiliser l'application</strong><small>5 pages, en quelques minutes</small></span>
        <span className="guide-card-go" aria-hidden="true">›</span>
      </button>

      {open && createPortal(
        <div className="guide-backdrop" role="presentation" onClick={close}>
          <div className="guide-sheet" role="dialog" aria-modal="true" aria-label="Guide de l'application" onClick={(e) => e.stopPropagation()}>
            <div className="guide-top">
              <span className="guide-count">{page + 1} / {PAGES.length}</span>
              <button type="button" className="guide-skip" onClick={close}>Passer</button>
            </div>

            <div className="guide-preview" aria-hidden="true">
              {current.preview.map(([label, kind]) => (
                <div key={label} className={`guide-mock guide-mock-${kind}`}>{label}</div>
              ))}
            </div>

            <h3>{current.title}</h3>
            <p>{current.text}</p>

            <div className="guide-dots" aria-hidden="true">
              {PAGES.map((_, i) => <span key={i} className={i === page ? "guide-dot guide-dot-on" : "guide-dot"} />)}
            </div>

            <div className="guide-nav">
              <button type="button" className="guide-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button>
              {last
                ? <button type="button" className="guide-btn guide-btn-primary" onClick={close}>Terminer</button>
                : <button type="button" className="guide-btn guide-btn-primary" onClick={() => setPage(page + 1)}>Suivant</button>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
