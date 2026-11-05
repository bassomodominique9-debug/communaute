import { useState } from "react";
import "./catalog-hub.css";

const go = (page) => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page }));

// Catalogues ED B-CENTER : un catalogue principal qui regroupe les catalogues de l'école.
// Les catalogues des entreprises seront ajoutés ici dans un lot suivant.
const CATALOGUES = [
  { key: "photo", title: "Photographie", text: "Studio et événements" },
  { key: "tableaux", title: "Tableaux muraux", text: "Formats bois sur mesure" },
  { key: "chine", title: "Précommandes Chine", text: "Sourcing et importation" },
  { key: "design", title: "Design et communication", text: "Logos, flyers, visuels" },
];

const PILIERS = [
  { n: "01", title: "Apprendre", text: "Acquérir des compétences utiles, avec un accompagnement.", page: "courses" },
  { n: "02", title: "Pratiquer", text: "Réaliser des exercices et des ateliers concrets.", page: "atelier" },
  { n: "03", title: "Entreprendre", text: "Trouver des services, des clients et des opportunités.", page: "jobs" },
];

const PREUVES = [
  { icon: "🎨", text: "Des services créatifs à prix clairs", page: "services" },
  { icon: "💼", text: "Des offres d'emploi vérifiées", page: "jobs" },
  { icon: "🎓", text: "Des formations pratiques suivies", page: "courses" },
];

export default function CatalogHub() {
  const [open, setOpen] = useState(false);
  return (
    <section className="catalog-hub section-container" aria-label="Catalogues ED B-CENTER">
      <button type="button" className="catalog-hub-main" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="catalog-hub-logo" aria-hidden="true">EB</span>
        <span><strong>Catalogues ED B-CENTER</strong><small>{CATALOGUES.length} catalogues de l'école</small></span>
        <span className="catalog-hub-chev">{open ? "⌄" : "›"}</span>
      </button>

      {open && (
        <div className="catalog-hub-list">
          {CATALOGUES.map((c) => (
            <button key={c.key} type="button" className="catalog-hub-item" onClick={() => go(c.key)}>
              <strong>{c.title}</strong>
              <small>{c.text}</small>
              <span className="catalog-hub-chev">›</span>
            </button>
          ))}
          <p className="catalog-hub-soon">Les catalogues des entreprises seront affichés ici.</p>
        </div>
      )}

      <div className="catalog-hub-piliers">
        {PILIERS.map((p) => (
          <button key={p.n} type="button" className="catalog-hub-pilier" onClick={() => go(p.page)}>
            <span className="catalog-hub-num">{p.n}</span>
            <strong>{p.title}</strong>
            <small>{p.text}</small>
          </button>
        ))}
      </div>

      <div className="catalog-hub-preuves">
        {PREUVES.map((p) => (
          <button key={p.text} type="button" className="catalog-hub-preuve" onClick={() => go(p.page)}>
            <span aria-hidden="true">{p.icon}</span>{p.text}
          </button>
        ))}
      </div>
    </section>
  );
}
