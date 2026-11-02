import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./portfolio-lot4.css";

const IMAGE = /\.(png|jpe?g|webp|gif)(\?|$)/i;
const fileUrl = (a) => (typeof a === "string" ? a : a?.url || "");
const fileName = (a) => (typeof a === "string" ? a.split("/").pop() : a?.name || a?.url?.split("/").pop() || "fichier");
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const learnerName = (l) => l.full_name || [l.first_name, l.last_name].filter(Boolean).join(" ") || l.email || "Apprenant";

// Ouvre une page prête à enregistrer en PDF (Imprimer > Enregistrer au format PDF)
function openPortfolioPdf(entry) {
  const name = learnerName(entry.learner);
  const items = entry.items.map((it) => {
    const files = (it.attachments || []).map((a) => {
      const url = fileUrl(a);
      return IMAGE.test(url)
        ? `<img src="${esc(url)}" alt="${esc(fileName(a))}" />`
        : `<p><a href="${esc(url)}">${esc(fileName(a))}</a></p>`;
    }).join("");
    return `<section class="item"><h2>${esc(it.title)}</h2>${it.description ? `<p>${esc(it.description)}</p>` : ""}${files}</section>`;
  }).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>Portfolio — ${esc(name)}</title>
<style>body{font-family:Arial,sans-serif;color:#0b1b45;margin:32px;max-width:760px}h1{color:#0a2e7a;border-bottom:3px solid #e8b84a;padding-bottom:8px}
.item{margin:22px 0;padding-bottom:14px;border-bottom:1px solid #dde3ee;page-break-inside:avoid}img{max-width:100%;border-radius:8px;margin:8px 0}
.meta{color:#64748b;font-size:13px}</style></head><body onload="setTimeout(()=>window.print(),300)">
<h1>Portfolio — ${esc(name)}</h1><p class="meta">ED B-CENTER · ${entry.items.length} réalisation(s) · ${new Date().toLocaleDateString("fr-FR")}</p>${items}</body></html>`;
  const w = window.open("", "_blank");
  if (!w) { window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: "Autorise les fenêtres pop-up pour télécharger le portfolio." })); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

// Vue staff : portfolios classés par nom, téléchargeables
export default function PortfolioStaff() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("staff_list_portfolios");
      if (!active) return;
      if (error) window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: error.message }));
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const shown = rows
    .filter((r) => learnerName(r.learner).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => learnerName(a.learner).localeCompare(learnerName(b.learner), "fr"));

  return (
    <section className="portfolio-staff" aria-label="Portfolios des apprenants">
      <span className="eyebrow">PORTFOLIOS</span>
      <h2>Réalisations des apprenants</h2>
      <input className="portfolio-search" placeholder="Rechercher un apprenant" value={query} onChange={(e) => setQuery(e.target.value)} />
      {loading && <p className="portfolio-note">Chargement…</p>}
      {!loading && shown.length === 0 && <p className="portfolio-note">Aucun portfolio pour le moment.</p>}
      <div className="portfolio-list">
        {shown.map((entry) => (
          <article key={entry.learner.id} className="portfolio-card">
            <div>
              <strong>{learnerName(entry.learner)}</strong>
              <small>{entry.items.length} réalisation(s)</small>
            </div>
            <button type="button" className="button button-primary" onClick={() => openPortfolioPdf(entry)}>Télécharger en PDF</button>
          </article>
        ))}
      </div>
    </section>
  );
}
