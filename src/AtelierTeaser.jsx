import "./atelier.css";

// Carte d'accès aux ateliers sur l'accueil
export default function AtelierTeaser() {
  return (
    <section className="section-container atelier-teaser" aria-label="Ateliers">
      <span className="eyebrow">ATELIERS</span>
      <h2>Réserve ta place à un atelier</h2>
      <p>Des ateliers pratiques, en présentiel ou en ligne. Ticket à 2 500 FCFA, paiement sécurisé et confirmation par l'équipe.</p>
      <button type="button" className="button button-primary atelier-teaser-btn" onClick={() => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: "atelier" }))}>
        Voir les ateliers
      </button>
    </section>
  );
}
