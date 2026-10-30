/**
 * Registre central des images ED BUSINESS CENTER.
 * Les noms ci-dessous sont ceux identifiés dans le PDF de disposition fourni.
 * Ce registre ne prouve pas que chaque fichier est déjà présent dans Supabase.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jvwmkoshkkzupgrjcttx.supabase.co";
export const IMAGE_BUCKET = import.meta.env.VITE_SUPABASE_IMAGE_BUCKET || "ed-b-center-images";
export const IMAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}`;

export const IMAGE_ASSETS = [
  {
    "name": "atelier-visuel-aucun-evenement.png",
    "category": "ateliers"
  },
  {
    "name": "atelier-visuel-paiement-securise.png",
    "category": "ateliers"
  },
  {
    "name": "atelier-visuel-reservation-confirmee.png",
    "category": "ateliers"
  },
  {
    "name": "avatar-default-formatrice.png",
    "category": "avatars"
  },
  {
    "name": "banniere-communaute-ed-b-center.png",
    "category": "bannieres"
  },
  {
    "name": "banniere-ed-b-center.png",
    "category": "bannieres"
  },
  {
    "name": "banniere-evenement-ed-b-center.png",
    "category": "bannieres"
  },
  {
    "name": "banniere-nouveau-service.png",
    "category": "bannieres"
  },
  {
    "name": "banniere-promotion-formation.png",
    "category": "bannieres"
  },
  {
    "name": "course-big-data.png",
    "category": "formations"
  },
  {
    "name": "course-excel.png",
    "category": "formations"
  },
  {
    "name": "course-infographie-ia.png",
    "category": "formations"
  },
  {
    "name": "course-power-bi.png",
    "category": "formations"
  },
  {
    "name": "course-sourcing-chine.png",
    "category": "formations"
  },
  {
    "name": "file_00000000d9c4820eb442dbf782b375e9.png",
    "category": "à-identifier"
  },
  {
    "name": "illustration-accompagnement-apprenant.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-analyse-donnees.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-apprentissage.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-aucun-projet.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-aucun-resultat.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-aucune-demande.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-aucune-formation.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-bibliotheque-images.png",
    "category": "administration"
  },
  {
    "name": "illustration-certificat-formation.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-coaching-entrepreneur.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-commande-en-cours.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-commande-terminee.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-communaute-apprenants.png",
    "category": "communication"
  },
  {
    "name": "illustration-comparaison-produits.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-compte-cree.png",
    "category": "compte-et-systeme"
  },
  {
    "name": "illustration-connexion-reussie.png",
    "category": "compte-et-systeme"
  },
  {
    "name": "illustration-conseil-du-jour.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-conseil-professionnel.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-conversation-vide.png",
    "category": "communication"
  },
  {
    "name": "illustration-creation-contenu.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-creation-graphique.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-decouverte-metiers.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-defi-pratique.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-developpement-activite.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-erreur-chargement.png",
    "category": "compte-et-systeme"
  },
  {
    "name": "illustration-espace-personnel.png",
    "category": "compte-et-systeme"
  },
  {
    "name": "illustration-estimation-cout.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-exercices-pratiques.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-formatrice.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-gestion-actualites.png",
    "category": "administration"
  },
  {
    "name": "illustration-gestion-demandes.png",
    "category": "administration"
  },
  {
    "name": "illustration-gestion-formations.png",
    "category": "administration"
  },
  {
    "name": "illustration-gestion-messages.png",
    "category": "administration"
  },
  {
    "name": "illustration-gestion-reseaux-sociaux.png",
    "category": "administration"
  },
  {
    "name": "illustration-gestion-roles.png",
    "category": "administration"
  },
  {
    "name": "illustration-gestion-services.png",
    "category": "administration"
  },
  {
    "name": "illustration-gestion-utilisateurs.png",
    "category": "administration"
  },
  {
    "name": "illustration-historique-commandes.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-importer-image.png",
    "category": "administration"
  },
  {
    "name": "illustration-intelligence-artificielle.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-message-envoye.png",
    "category": "communication"
  },
  {
    "name": "illustration-messagerie.png",
    "category": "communication"
  },
  {
    "name": "illustration-mot-de-passe-oublie.png",
    "category": "compte-et-systeme"
  },
  {
    "name": "illustration-notifications-vides.png",
    "category": "communication"
  },
  {
    "name": "illustration-notifications.png",
    "category": "communication"
  },
  {
    "name": "illustration-page-introuvable.png",
    "category": "compte-et-systeme"
  },
  {
    "name": "illustration-parametres-compte.png",
    "category": "compte-et-systeme"
  },
  {
    "name": "illustration-partage-connaissances.png",
    "category": "communication"
  },
  {
    "name": "illustration-pieces-automobiles.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-plan-action.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-produits-introuvables.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-produits-locaux.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-progression-formation.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-projet-etudiant.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-proposition-produit.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-recherche-fournisseur.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-recherche-produits.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-remplacer-image.png",
    "category": "administration"
  },
  {
    "name": "illustration-ressources-pedagogiques.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-service-numerique.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-sourcing-chine.png",
    "category": "formation-et-numerique"
  },
  {
    "name": "illustration-statistiques-admin.png",
    "category": "administration"
  },
  {
    "name": "illustration-suivi-client.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-suivi-commande.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-suivi-demande.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-suivi-projet.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-tableau-de-bord-admin.png",
    "category": "administration"
  },
  {
    "name": "illustration-tableau-de-bord.png",
    "category": "administration"
  },
  {
    "name": "illustration-telephones-electronique.png",
    "category": "illustrations-diverses"
  },
  {
    "name": "illustration-transport-marchandises.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-validation-demande.png",
    "category": "produits-commandes"
  },
  {
    "name": "illustration-verification-produit.png",
    "category": "produits-commandes"
  },
  {
    "name": "interface-actualites.png",
    "category": "interfaces"
  },
  {
    "name": "interface-atelier-1.png",
    "category": "interfaces"
  },
  {
    "name": "interface-confirmation-ticket.png",
    "category": "interfaces"
  },
  {
    "name": "interface-messagerie.png",
    "category": "interfaces"
  },
  {
    "name": "interface-notifications.png",
    "category": "interfaces"
  },
  {
    "name": "interface-participants-atelier.png",
    "category": "interfaces"
  },
  {
    "name": "interface-profil-public.png",
    "category": "interfaces"
  },
  {
    "name": "interface-reservation-atelier.png",
    "category": "interfaces"
  },
  {
    "name": "le-reseau-inscription-fonctionnement.png",
    "category": "le-reseau"
  },
  {
    "name": "le-reseau-petits-stocks.png",
    "category": "le-reseau"
  },
  {
    "name": "le-reseau-produits-sur-commande.png",
    "category": "le-reseau"
  },
  {
    "name": "le-reseau-recherche-pieces-auto.png",
    "category": "le-reseau"
  },
  {
    "name": "logo-ed-b-center.png",
    "category": "logos"
  },
  {
    "name": "logo-le-reseau.png",
    "category": "logos"
  },
  {
    "name": "motivation-01-discipline-et-perseverance.png",
    "category": "motivation"
  },
  {
    "name": "motivation-02-formation-et-competences.png",
    "category": "motivation"
  },
  {
    "name": "motivation-03-passer-a-laction.png",
    "category": "motivation"
  },
  {
    "name": "motivation-04-entrepreneuriat-et-reussite.png",
    "category": "motivation"
  },
  {
    "name": "motivation-05-croire-en-son-potentiel.png",
    "category": "motivation"
  },
  {
    "name": "motivation-06-apprendre-et-progresser.png",
    "category": "motivation"
  },
  {
    "name": "motivation-07-transformer-ses-idees-en-projets.png",
    "category": "motivation"
  },
  {
    "name": "motivation-08-construire-son-avenir.png",
    "category": "motivation"
  },
  {
    "name": "motivation-09-investir-en-soi.png",
    "category": "motivation"
  },
  {
    "name": "motivation-10-oser-commencer.png",
    "category": "motivation"
  },
  {
    "name": "motivation-11-competences-et-opportunites.png",
    "category": "motivation"
  },
  {
    "name": "motivation-12-apprendre-pratiquer-entreprendre.png",
    "category": "motivation"
  },
  {
    "name": "publication-actualites-01-comprendre-les-actualites.png",
    "category": "publications"
  },
  {
    "name": "publication-atelier-01-decouvrir-les-ateliers.png",
    "category": "publications"
  },
  {
    "name": "publication-atelier-02-reserver-et-payer-son-ticket.png",
    "category": "publications"
  },
  {
    "name": "publication-atelier-03-confirmation-et-participants.png",
    "category": "publications"
  },
  {
    "name": "publication-communaute-01-decouvrir-la-communaute.png",
    "category": "publications"
  },
  {
    "name": "publication-communaute-02-interagir-et-commenter.png",
    "category": "publications"
  },
  {
    "name": "publication-communaute-03-profils-et-abonnements.png",
    "category": "publications"
  },
  {
    "name": "service-ed-b-academy.png",
    "category": "services"
  },
  {
    "name": "service-ed-b-consulting.png",
    "category": "services"
  },
  {
    "name": "service-ed-b-solutions.png",
    "category": "services"
  },
  {
    "name": "service-ed-b-sourcing.png",
    "category": "services"
  },
  {
    "name": "service-ed-digital-service.png",
    "category": "services"
  },
  {
    "name": "service-le-reseau.png",
    "category": "services"
  }
];

export const IMAGE_GROUPS = IMAGE_ASSETS.reduce((groups, item) => {
  (groups[item.category] ||= []).push(item.name);
  return groups;
}, {});

export function imageUrl(filename) {
  if (!filename) return "";
  // Preserve already absolute URLs stored in publication/atelier records.
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${IMAGE_BASE_URL}/${encodeURIComponent(filename)}`;
}

export function imageByName(filename) {
  return IMAGE_ASSETS.find((item) => item.name === filename) || null;
}
