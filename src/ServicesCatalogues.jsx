import { useState } from "react";
import { CompanyList, CompanyDetail, CatalogueCreate, MyCatalogue, Stars } from "./CatalogueEntreprises";
import { imageUrl } from "./imageCatalog";
import "./services-catalogues.css";

// Catalogue officiel ED B-CENTER : regroupe les services de l'école (cubes)
function EdCatalogue({ services, onSelectService, onBack }) {
  return (
    <section className="ce-detail">
      <header className="ce-head">
        <button type="button" className="ce-back" aria-label="Retour" onClick={onBack}>‹</button>
        <img className="ce-head-avatar" src={imageUrl("logo-ed-b-center.png")} alt="" />
        <strong>ED B-CENTER</strong>
      </header>
      <small className="ce-cube-domaine">Catalogue officiel</small>
      <p className="ce-desc">Nos formations, services créatifs et accompagnements.</p>
      <div className="ce-grid">
        {services.map((sv) => (
          <button key={sv.id} type="button" className="ce-card ce-cube" onClick={() => onSelectService ? onSelectService(sv) : null}>
            <div className="ce-cube-photo"><img src={imageUrl(sv.image)} alt="" loading="lazy" /></div>
            <div className="ce-cube-info">
              <strong>{sv.name}</strong>
              <small className="ce-cube-domaine">{sv.category}</small>
              <small className="ce-cube-desc">{sv.description}</small>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// Bloc « Catalogues des entreprises » dans la section Nos domaines d'activité
export default function ServicesCatalogues({ services = [], onSelectService }) {
  const [view, setView] = useState(null);
  const [company, setCompany] = useState(null);
  if (view === "ed") return <div className="sc-wrap"><EdCatalogue services={services} onSelectService={onSelectService} onBack={() => setView(null)} /></div>;
  if (view === "company" && company) return <div className="sc-wrap"><CompanyDetail company={company} onBack={() => setView(null)} /></div>;
  if (view === "create") return <div className="sc-wrap"><CatalogueCreate onBack={() => setView(null)} onDone={() => setView(null)} /></div>;
  if (view === "manage") return <div className="sc-wrap"><MyCatalogue onBack={() => setView(null)} /></div>;
  return (
    <section className="sc-wrap" aria-label="Catalogues">
      <span className="sc-eyebrow">CATALOGUES</span>
      <h3 className="sc-title">Découvre les catalogues des entreprises</h3>
      <div className="ce-grid">
        <button type="button" className="ce-card ce-cube" onClick={() => setView("ed")}>
          <div className="ce-cube-photo"><img src={imageUrl("logo-ed-b-center.png")} alt="" /></div>
          <div className="ce-cube-info">
            <strong>ED B-CENTER</strong>
            <small className="ce-cube-domaine">Catalogue officiel</small>
            <small className="ce-cube-desc">Formations et services créatifs</small>
          </div>
        </button>
      </div>
      <CompanyList onOpen={(c) => { setCompany(c); setView("company"); }} />
      <div className="sc-actions">
        <button type="button" className="sc-action" onClick={() => setView("create")}>Créer mon catalogue</button>
        <button type="button" className="sc-action" onClick={() => setView("manage")}>Gérer mon catalogue</button>
      </div>
    </section>
  );
}
