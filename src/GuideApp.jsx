import { useState } from "react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { supabase } from "./supabaseClient";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
import "./guide.css";

// Guide « Comment utiliser l'application » : 5 pages, aperçu simplifié, ce que l'on voit et fait
const PAGES = [
  {
    title: "L'accueil",
    text: "Six raccourcis t'emmènent partout : Accueil, Services, Formations, Communauté, Emploi et Mon espace. Les annonces importantes apparaissent quand elles sont publiées.",
    preview: [["Accueil", "tile"], ["Services", "tile"], ["Formations", "tile"], ["Mon espace", "tile"]],
  },
  {
    title: "Services et entreprises",
    text: "Dans Services, chaque entreprise est présentée par une affiche avec ses étoiles. Touche Visiter pour voir ses prestations, puis Commander.",
    preview: [["Affiche entreprise", "wide"], ["Visiter", "pill"]],
  },
  {
    title: "Formations et ateliers",
    text: "Choisis une formation et touche S'inscrire. Pour un atelier, touche Réserver : le ticket est de 2 500 FCFA. Compose le code, puis envoie la photo de la transaction.",
    preview: [["S'inscrire", "pill"], ["Réserver", "pill"]],
  },
  {
    title: "Communauté et emploi",
    text: "Dans la communauté, touche « Publier dans la communauté » pour partager un message. Chaque publication donne un point. Dans Emploi, les offres vérifiées t'attendent.",
    preview: [["Publier", "wide"], ["Offre vérifiée", "tile"]],
  },
  {
    title: "Mon espace et l'assistance",
    text: "Mon espace regroupe ton profil, tes demandes, ton catalogue si tu en as un, et ton parrainage. Besoin d'aide ? Touche le menu ⋯, puis Assistance, sous Déconnexion.",
    preview: [["Mon profil", "tile"], ["Mon catalogue", "tile"], ["Assistance", "wide"]],
  },
];

export default function GuideApp() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState({ loaded: false, show: false, isAdmin: false });
  const last = page === PAGES.length - 1;

  useEffect(() => {
    let active = true;
    supabase.rpc("guide_status").then(({ data, error }) => {
      if (!active) return;
      setStatus({ loaded: true, show: !error && Boolean(data?.show), isAdmin: !error && Boolean(data?.is_admin) });
    });
    return () => { active = false; };
  }, []);

  // Passer ou Terminer : le guide disparaît de l'accueil pour ce compte
  async function close() {
    setOpen(false);
    setPage(0);
    setStatus((st) => ({ ...st, show: false }));
    await supabase.rpc("guide_mark_done");
  }

  async function reactivate() {
    const { error } = await supabase.rpc("admin_guide_reactivate");
    if (error) { notify(error.message); return; }
    notify("Guide réactivé : il s'affichera une fois pour chaque utilisateur.");
    setStatus((st) => ({ ...st, show: true }));
  }
  const current = PAGES[page];

  if (!status.loaded) return null;

  return (
    <>
      {status.isAdmin && (
        <button type="button" className="guide-admin-reactivate" onClick={reactivate}>Réactiver le guide pour tous</button>
      )}
      {status.show && (
      <button type="button" className="guide-card" onClick={() => { setPage(0); setOpen(true); }}>
        <span className="guide-card-icon" aria-hidden="true">📖</span>
        <span><strong>Comment utiliser l'application</strong><small>5 pages, en quelques minutes</small></span>
        <span className="guide-card-go" aria-hidden="true">›</span>
      </button>
      )}

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
