import { useState } from "react";
import "./catalog-hub.css";
import { CompanyList, CompanyDetail, CatalogueCreate, MyCatalogue } from "./CatalogueEntreprises";

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
  const [view, setView] = useState(null);
  const [company, setCompany] = useState(null);
  if (view === "company" && company) return <section className="catalog-hub section-container"><CompanyDetail company={company} onBack={() => setView(null)} /></section>;
  if (view === "create") return <section className="catalog-hub section-container"><CatalogueCreate onBack={() => setView(null)} onDone={() => setView(null)} /></section>;
  if (view === "manage") return <section className="catalog-hub section-container"><MyCatalogue onBack={() => setView(null)} /></section>;
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
          <p className="catalog-hub-sub">Catalogues des entreprises</p>
          <CompanyList onOpen={(c) => { setCompany(c); setView("company"); }} />
          <div className="catalog-hub-actions">
            <button type="button" className="catalog-hub-action" onClick={() => setView("create")}>Créer mon catalogue</button>
            <button type="button" className="catalog-hub-action" onClick={() => setView("manage")}>Gérer mon catalogue</button>
          </div>
        </div>
      )}

    </section>
  );
}
