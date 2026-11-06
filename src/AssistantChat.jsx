import { useEffect, useRef, useState } from "react";
import "./assistant.css";

// Assistant à réponses préparées : 5 questions au départ, puis 3 questions après chaque réponse.
const WHATSAPP = "https://wa.me/237653993968";

const TREE = {
  create: { q: "Comment créer mon compte ?", a: "Appuie sur Connexion, puis Créer un compte. Donne ton nom, ton téléphone et ton e-mail. Le code de parrainage est facultatif.", next: ["forgot", "profile", "securite"] },
  forgot: { q: "J'ai oublié mon mot de passe.", a: "Sur l'écran de connexion, touche « Mot de passe oublié ». Un lien est envoyé à ton e-mail.", next: ["create", "profile", "securite"] },
  profile: { q: "Comment compléter mon profil ?", a: "Va dans Mon espace, puis Compléter mon profil. Ajoute ton adresse, ton numéro et ta photo : elle apparaît aussi sur ton catalogue.", next: ["catalogue_create", "formations_enroll", "ateliers_book"] },

  ateliers_book: { q: "Comment réserver un atelier ?", a: "Ouvre la carte Ateliers sur l'accueil, choisis un atelier, puis touche Réserver.", next: ["pay", "after", "securite"] },
  pay: { q: "Comment payer mon ticket ?", a: "Compose le code affiché, puis envoie la photo de ta transaction dans la page de paiement.", next: ["after", "securite", "devis"] },
  after: { q: "Que se passe-t-il après ma réservation ?", a: "L'équipe vérifie le paiement. Tu reçois une notification, et ta réservation apparaît dans Mes ateliers.", next: ["pay", "profile", "devis"] },

  catalogue_visit: { q: "Comment voir les entreprises ?", a: "Ouvre l'onglet Services. Tu y trouves les affiches des entreprises, avec leurs étoiles. Touche Visiter pour voir leurs prestations.", next: ["catalogue_order", "catalogue_stars", "devis"] },
  catalogue_order: { q: "Comment commander une prestation ?", a: "Dans la page d'une entreprise, touche Commander sur la prestation choisie. WhatsApp s'ouvre avec le message prêt. Pour ED B-CENTER, le message est préparé dans la messagerie.", next: ["catalogue_visit", "pay", "securite"] },
  catalogue_stars: { q: "À quoi servent les étoiles ?", a: "Une étoile est ajoutée pour 10 personnes différentes qui cliquent sur Commander, jusqu'à 6 étoiles. Les entreprises les mieux notées apparaissent en premier.", next: ["catalogue_visit", "catalogue_create", "securite"] },
  catalogue_create: { q: "Comment créer mon catalogue ?", a: "Dans Services, touche Créer mon catalogue. Remplis le nom, le domaine, la description, ton numéro WhatsApp et ta localisation. Un seul catalogue par compte.", next: ["catalogue_price", "catalogue_publish", "catalogue_visit"] },
  catalogue_price: { q: "Combien coûte un catalogue ?", a: "Particulier : 5 000 FCFA par mois. Grande entreprise : 25 000 FCFA pour 2 mois, soit 12 500 FCFA par mois. Le paiement se règle dans Gérer mon catalogue, puis l'équipe confirme.", next: ["catalogue_create", "pay", "securite"] },
  catalogue_publish: { q: "Comment publier dans mon catalogue ?", a: "Ouvre Gérer mon catalogue, puis Publier dans mon catalogue. Écris ta prestation, ajoute une photo si tu veux, puis publie.", next: ["catalogue_create", "catalogue_visit", "securite"] },

  formations_enroll: { q: "Comment m'inscrire à une formation ?", a: "Va dans Formations, choisis ta formation, puis touche S'inscrire.", next: ["espace", "who", "ateliers_book"] },
  espace: { q: "Comment accéder à mon espace apprenant ?", a: "L'espace apprenant est réservé aux apprenants inscrits. Il se trouve dans Mon espace, puis Mon parcours.", next: ["who", "formations_enroll", "profile"] },
  who: { q: "Qui peut voir mon espace apprenant ?", a: "Seuls les apprenants inscrits, la formatrice et l'administration. Les autres comptes ne le voient pas.", next: ["espace", "formations_enroll", "securite"] },

  emploi_find: { q: "Comment trouver un emploi ?", a: "Ouvre la page Emploi. Les offres vérifiées sont affichées, avec les informations utiles.", next: ["candidat", "offre", "securite"] },
  candidat: { q: "Comment créer mon profil candidat ?", a: "Va dans Emploi, puis Mon profil candidat. Remplis tes compétences, ta disponibilité et ton CV.", next: ["emploi_find", "offre", "profile"] },
  offre: { q: "Comment publier une offre ?", a: "Va dans Emploi, puis Publier une offre. L'offre est publiée après vérification du paiement.", next: ["candidat", "emploi_find", "catalogue_create"] },

  post: { q: "Comment publier dans la communauté ?", a: "Ouvre la page Communauté, touche la barre « Publier dans la communauté », puis écris ton message et ajoute une photo si tu veux.", next: ["report", "points", "securite"] },
  report: { q: "Comment signaler une publication ?", a: "Sous la publication, touche Signaler. WhatsApp s'ouvre avec le message prêt : tu n'as qu'à le compléter.", next: ["securite", "points", "post"] },
  points: { q: "Comment gagner des points ?", a: "Une publication donne un point maximum par compte. Aimer ou commenter la même publication ne donne pas de point supplémentaire.", next: ["post", "report", "profile"] },

  devis: { q: "Comment demander un devis ?", a: "Ouvre Services, puis touche Visiter sur l'entreprise ou le service qui t'intéresse. Décris ton besoin et ton délai, puis envoie la demande.", next: ["suivi", "catalogue_visit", "pay"] },
  suivi: { q: "Comment suivre ma demande ?", a: "Ouvre Mon espace : ta demande apparaît avec son étape : envoyée, paiement reçu, confirmée, livrée.", next: ["devis", "after", "profile"] },

  securite: { q: "Comment repérer une arnaque ?", a: "Aucune entreprise ne te demandera de l'argent pour un travail. Méfie-toi des promesses trop belles.", next: ["report", "devis", "create"] },
};

// Les 5 questions d'accueil
const START = ["create", "ateliers_book", "catalogue_visit", "formations_enroll", "emploi_find"];

export default function AssistantChat({ inline = false }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Bonjour, je suis l'assistant ED B-CENTER. Choisis une question pour commencer." },
  ]);
  const [options, setOptions] = useState(START);
  const [typing, setTyping] = useState(false);
  const scroller = useRef(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function ask(id) {
    const node = TREE[id];
    if (!node) return;
    setMessages((m) => [...m, { from: "user", text: node.q }]);
    setOptions([]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: "bot", text: node.a }]);
      setOptions(node.next);
    }, 650);
  }

  return (
    <section className={inline ? "assistant assistant-inline" : "assistant"} aria-label="Assistant ED B-CENTER">
      <div className="assistant-head">
        <span className="assistant-avatar" aria-hidden="true">EB</span>
        <div><strong>Assistant ED B-CENTER</strong><small>Réponses rapides, sans attente</small></div>
      </div>

      <div className="assistant-thread" ref={scroller}>
        {messages.map((m, i) => (
          <div key={i} className={m.from === "bot" ? "bubble bubble-bot" : "bubble bubble-user"}>{m.text}</div>
        ))}
        {typing && <div className="bubble bubble-bot bubble-typing"><span /><span /><span /></div>}
      </div>

      <div className="assistant-options">
        {options.map((id) => (
          <button key={id} type="button" className="assistant-option" onClick={() => ask(id)}>{TREE[id].q}</button>
        ))}
        {!typing && options.length === 0 && (
          <button type="button" className="assistant-option assistant-option-back" onClick={() => setOptions(START)}>Autres questions</button>
        )}
        <a className="assistant-option assistant-option-team" href={WHATSAPP} target="_blank" rel="noopener noreferrer">Écrire à l'équipe</a>
      </div>
    </section>
  );
}
