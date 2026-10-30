import { useState } from "react";
import { supabase } from "./supabaseClient";

const LABEL = { Formation: "courses", Service: "services", Publication: "community", Membre: "community", "Offre d'emploi": "jobs" };

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  async function search(event) {
    event.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("search_all", { p_q: q.trim() });
    setBusy(false);
    if (error) { window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: error.message })); return; }
    setResults(Array.isArray(data) ? data : []);
  }
  return (
    <section className="section-container search-box" aria-label="Recherche">
      <form onSubmit={search} className="search-form">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une formation, un service, un membre, une offre…" maxLength={80} />
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "…" : "Rechercher"}</button>
      </form>
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" className="text-button" onClick={() => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: LABEL[r.type] || "home" }))}>
                <b>{r.type}</b> · {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.length === 0 && q && !busy && <p className="jobs-empty">Aucun résultat.</p>}
    </section>
  );
}
