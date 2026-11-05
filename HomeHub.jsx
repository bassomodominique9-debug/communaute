import "./home-hub.css";

// Trois piliers : Apprendre, Pratiquer, Entreprendre
const PILLARS = [
  { n: "01", title: "Apprendre", text: "Acquérir des compétences utiles, avec un suivi personnel." },
  { n: "02", title: "Pratiquer", text: "Réaliser des exercices et des projets concrets." },
  { n: "03", title: "Entreprendre", text: "Trouver clients, partenaires et opportunités." },
];

// Preuves : ce que l'application propose, sans chiffre inventé
const PROOFS = [
  { label: "Services créatifs à prix clairs", page: null },
  { label: "Offres d'emploi vérifiées", page: "jobs" },
  { label: "Formations pratiques avec suivi", page: "courses" },
];

export default function HomeHub() {
  return (
    <section className="section-container home-hub" aria-label="ED B-CENTER en bref">
      <div className="home-pillars">
        {PILLARS.map((p) => (
          <article key={p.n} className="home-pillar">
            <span className="home-pillar-num">{p.n}</span>
            <strong>{p.title}</strong>
            <small>{p.text}</small>
          </article>
        ))}
      </div>
      <div className="home-proofs">
        {PROOFS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="home-proof"
            disabled={!p.page}
            onClick={() => p.page && window.dispatchEvent(new CustomEvent("ed-navigate", { detail: p.page }))}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>
  );
}
