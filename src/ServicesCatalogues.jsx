import { useState } from "react";
import { CompanyList, CompanyDetail, CatalogueCreate, MyCatalogue } from "./CatalogueEntreprises";
import "./services-catalogues.css";

// Bloc « Catalogues des entreprises » dans la section Nos domaines d'activité
export default function ServicesCatalogues() {
  const [view, setView] = useState(null);
  const [company, setCompany] = useState(null);
  if (view === "company" && company) return <div className="sc-wrap"><CompanyDetail company={company} onBack={() => setView(null)} /></div>;
  if (view === "create") return <div className="sc-wrap"><CatalogueCreate onBack={() => setView(null)} onDone={() => setView(null)} /></div>;
  if (view === "manage") return <div className="sc-wrap"><MyCatalogue onBack={() => setView(null)} /></div>;
  return (
    <section className="sc-wrap" aria-label="Catalogues des entreprises">
      <span className="sc-eyebrow">CATALOGUES DES ENTREPRISES</span>
      <h3 className="sc-title">Découvre les entreprises qui présentent leurs services</h3>
      <CompanyList onOpen={(c) => { setCompany(c); setView("company"); }} />
      <div className="sc-actions">
        <button type="button" className="sc-action" onClick={() => setView("create")}>Créer mon catalogue</button>
        <button type="button" className="sc-action" onClick={() => setView("manage")}>Gérer mon catalogue</button>
      </div>
    </section>
  );
}
