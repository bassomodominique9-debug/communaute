import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { imageUrl } from "./imageCatalog";
import { CatalogueCreate, MyCatalogue } from "./CatalogueEntreprises";
import "./services-catalogues.css";

const ED_NUM = "237653993968";
const ED_NAME = "ED B-CENTER";

// Commander : ED -> messagerie interne ; entreprise -> WhatsApp de l'entreprise
function commander(company, ed, title) {
  const text = `Bonjour, je souhaite commander : ${title}`;
  if (ed) {
    sessionStorage.setItem("ed-draft", text);
    window.dispatchEvent(new CustomEvent("ed-navigate", { detail: "messages" }));
    return;
  }
  supabase.rpc("order_catalogue", { p_id: company.id });
  const num = String(company.whatsapp || "").replace(/\D/g, "");
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

function Stars({ value }) {
  return <div className="sc-stars">{[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i < value ? "on" : ""}>★</span>)}</div>;
}

// Chargement des publications d'une entreprise (les prestations)
function usePubs(company, ed) {
  const [pubs, setPubs] = useState(null);
  useEffect(() => {
    if (ed || !company) { setPubs([]); return; }
    supabase.rpc("list_catalogue_publications", { p_id: company.id }).then(({ data }) => setPubs(Array.isArray(data) ? data : []));
  }, [company, ed]);
  return pubs;
}

// Cube carré : photo en haut, prestations qui défilent en bas
function Cube({ company, ed, services, onOpen }) {
  const pubs = usePubs(company, ed);
  const items = ed ? services.map((sv) => ({ id: sv.id, title: sv.name, photo: imageUrl(sv.image) }))
                   : (pubs || []).map((p) => ({ id: p.id, title: p.body || company.name, photo: p.photo_url }));
  const photo = ed ? imageUrl("logo-ed-b-center.png") : company.photo_url;
  const name = ed ? ED_NAME : company.name;
  const domaine = ed ? "Catalogue officiel" : company.domaine;
  return (
    <article className="sc-cube">
      <button type="button" className="sc-cube-top" onClick={onOpen}>
        <img src={photo} alt="" loading="lazy" />
        <span className="sc-cube-name"><strong>{name}</strong><small>{domaine}</small></span>
      </button>
      <div className="sc-cube-row">
        {items.map((it) => (
          <div key={it.id} className="sc-mini">
            {it.photo ? <img src={it.photo} alt="" loading="lazy" /> : <div className="sc-mini-empty" />}
            <small>{it.title}</small>
            <button type="button" className="sc-btn" onClick={() => commander(company, ed, it.title)}>Commander</button>
          </div>
        ))}
      </div>
    </article>
  );
}

// Page entreprise : 3 images qui défilent en haut, prestations en grand en dessous
function CatalogPage({ company, ed, services, onBack }) {
  const pubs = usePubs(company, ed);
  const heroRef = useRef(null);
  const heroImgs = ed
    ? [imageUrl("logo-ed-b-center.png"), ...services.slice(0, 2).map((sv) => imageUrl(sv.image))]
    : [company.photo_url, company.flyer_url, company.logo_url].filter(Boolean);
  useEffect(() => {
    const el = heroRef.current; if (!el) return;
    const t = setInterval(() => {
      const next = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 ? 0 : el.scrollLeft + el.clientWidth;
      el.scrollTo({ left: next, behavior: "smooth" });
    }, 3500);
    return () => clearInterval(t);
  }, []);
  const prestations = ed ? services.map((sv) => ({ id: sv.id, title: sv.name, desc: sv.description, photo: imageUrl(sv.image) }))
                         : (pubs || []).map((p) => ({ id: p.id, title: p.body || company.name, desc: "", photo: p.photo_url }));
  return (
    <section className="sc-page">
      <header className="sc-page-head"><button type="button" className="sc-back" aria-label="Retour" onClick={onBack}>‹</button><strong>{ed ? ED_NAME : company.name}</strong></header>
      <div className="sc-hero" ref={heroRef}>
        {heroImgs.map((src, i) => <img key={i} src={src} alt="" />)}
      </div>
      <p className="sc-page-domaine">{ed ? "Catalogue officiel" : company.domaine}</p>
      {!ed && <p className="sc-page-desc">{company.description}</p>}
      {!ed && <Stars value={company.stars || 0} />}
      <div className="sc-prests">
        {prestations.map((p) => (
          <article key={p.id} className="sc-prest">
            {p.photo && <img src={p.photo} alt="" loading="lazy" />}
            <div className="sc-prest-body">
              <strong>{p.title}</strong>
              {p.desc && <small>{p.desc}</small>}
              <button type="button" className="sc-btn sc-btn-big" onClick={() => commander(company, ed, p.title)}>Commander</button>
            </div>
          </article>
        ))}
        {!ed && pubs && pubs.length === 0 && <p className="sc-empty">Aucune prestation publiée pour le moment.</p>}
      </div>
    </section>
  );
}

function Poster({ name, domaine, image, stars, onVisit }) {
  return (
    <article className="sc-poster">
      <div className="sc-poster-img"><img src={image} alt="" loading="lazy" /></div>
      <div className="sc-poster-info">
        <strong>{name}</strong>
        <small>{domaine}</small>
        <Stars value={stars} />
        <button type="button" className="sc-btn sc-btn-big" onClick={onVisit}>Visiter</button>
      </div>
    </article>
  );
}

export default function ServicesCatalogues({ services = [] }) {
  const [list, setList] = useState([]);
  const [view, setView] = useState(null);
  const [current, setCurrent] = useState(null);
  useEffect(() => {
    supabase.rpc("list_public_catalogues").then(({ data }) => setList(Array.isArray(data) ? data : []));
  }, []);
  if (view === "page") return <div className="sc-wrap">
    <CatalogPage company={current.company} ed={current.ed} services={services} onBack={() => setView(null)} />
  </div>;
  if (view === "create") return <div className="sc-wrap"><CatalogueCreate onBack={() => setView(null)} onDone={() => setView(null)} /></div>;
  if (view === "manage") return <div className="sc-wrap"><MyCatalogue onBack={() => setView(null)} /></div>;
  const open = (company, ed) => { setCurrent({ company, ed }); setView("page"); };
  return (
    <section className="sc-wrap" aria-label="Affiches des entreprises">
      <div className="sc-posters">
        <Poster name={ED_NAME} domaine="Catalogue officiel" image={imageUrl("logo-ed-b-center.png")} stars={5} onVisit={() => open(null, true)} />
        {list.map((c) => (
          <Poster key={c.id} name={c.name} domaine={c.domaine} image={c.flyer_url || c.photo_url} stars={c.stars || 0} onVisit={() => open(c, false)} />
        ))}
      </div>
      <div className="sc-actions">
        <button type="button" className="sc-action" onClick={() => setView("create")}>Créer mon catalogue</button>
        <button type="button" className="sc-action" onClick={() => setView("manage")}>Gérer mon catalogue</button>
      </div>
    </section>
  );
}
