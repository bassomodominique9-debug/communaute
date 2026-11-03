import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./account-catalog.css";
import { ProfileProgress, CompleteProfilePanel, BackArrow } from "./Marketing";

// Catalogue de « Mon espace » : seulement les options accessibles au rôle du compte

export default function AccountCatalog({ role, onOpen, profile }) {
  const [view, setView] = useState(null);
  const [coordAccess, setCoordAccess] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.rpc("coordinator_get_control_state").then(({ data, error }) => {
      if (active) setCoordAccess(!error && Boolean(data?.authorized));
    });
    return () => { active = false; };
  }, []);
  const isAdmin = role === "admin";
  const isTrainer = role === "trainer" || isAdmin;
  const isLearner = role === "apprenant";

  const tiles = [
    { key: "profile", icon: "👤", title: "Mon profil", sub: "Informations et photo", open: () => onOpen("profile") },
    { key: "messages", icon: "✉", title: "Messagerie", sub: "Tes conversations", open: () => onOpen("messages") },
    { key: "courses", icon: "▤", title: "Formations", sub: "Inscriptions et programmes", open: () => onOpen("courses") },
    { key: "ateliers", icon: "🧭", title: "Mes ateliers", sub: "Réservations et tickets", open: () => onOpen("ateliers") },
    { key: "referral", icon: "🎁", title: "Parrainage", sub: "Code, gains et retraits", open: () => onOpen("referral") },
    { key: "jobs", icon: "⌘", title: "Emploi", sub: "Offres et profil candidat", open: () => onOpen("jobs") },
    ...(isLearner ? [{ key: "learner", icon: "★", title: "Mon parcours", sub: "Exercices, notes, modules", open: () => onOpen("learner") }] : []),
    ...(isTrainer ? [{ key: "trainer", icon: "✎", title: "Espace formateur", sub: "Promotions et suivi", open: () => onOpen("trainer") }] : []),
    ...(isAdmin ? [{ key: "admin", icon: "⚙", title: "Administration", sub: "Gestion de la plateforme", open: () => onOpen("admin") }] : []),
    ...(isLearner ? [{ key: "attestations", icon: "🏅", title: "Mes attestations", sub: "Télécharger mes attestations", open: () => onOpen("attestations") }] : []),
    ...(isAdmin ? [{ key: "attestations-admin", icon: "✒", title: "Attestations", sub: "Émettre et envoyer", open: () => onOpen("attestations-admin") }] : []),
    ...(coordAccess ? [{ key: "coordinator", icon: "◈", title: "Coordination", sub: "Sécurité et accès", open: () => onOpen("coordinator") }] : []),
  ];

  if (view === "complete") {
    return (
      <section className="account-catalog" aria-label="Compléter mon profil">
        <CompleteProfilePanel onBack={() => setView(null)} onOpenProfile={() => onOpen("profile")} />
      </section>
    );
  }

  return (
    <section className="account-catalog" aria-label="Options de mon espace">
      <ProfileProgress profile={profile} />
      <button type="button" className="mk-chip mk-chip-slim" onClick={() => setView("complete")}>
        <span className="mk-chip-icon">✨</span><b>Compléter mon profil</b><span className="mk-chevron">›</span>
      </button>
      <h2 className="account-catalog-title">Mes options</h2>
      <div className="account-catalog-grid">
        {tiles.map((t) => (
          <button key={t.key} type="button" className="account-tile" onClick={t.open}>
            <span className="account-tile-icon" aria-hidden="true">{t.icon}</span>
            <strong>{t.title}</strong>
            <small>{t.sub}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
