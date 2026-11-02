import "./formations-lot3.css";

// Entrée vers l'espace apprenant : réservé aux apprenants, formatrice et administrateur
export function LearnerSpaceEntry({ role, onOpen, onDenied }) {
  const allowed = ["apprenant", "trainer", "admin"].includes(role);
  return (
    <section className="learner-entry" aria-label="Espace apprenant">
      <span className="eyebrow">ESPACE APPRENANT</span>
      <h2>Ton espace de formation</h2>
      <p>Cours, exercices, notes, présence et suivi. Cet espace est réservé aux apprenants inscrits : le statut apprenant est requis.</p>
      <button type="button" className="button button-primary" onClick={allowed ? onOpen : onDenied}>
        Accéder à l'espace apprenant
      </button>
      {!allowed && <small className="learner-entry-note">Réservé aux apprenants.</small>}
    </section>
  );
}
