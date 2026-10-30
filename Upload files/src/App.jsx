import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { imageUrl } from "./imageCatalog";
import CommunitySection from "./CommunitySection";
import NotificationsSection from "./NotificationsSection";
import AtelierSection from "./AtelierSection";
import Messenger from "./Messenger";
import ProfileCardModal from "./ProfileCardModal";
import AdminSpace from "./AdminSpace";
import FollowLists from "./FollowLists";
import DeleteAccount from "./DeleteAccount";
import Parcours from "./Parcours";
import ParcoursManager from "./ParcoursManager";
import HomeGate, { TopLearner } from "./HomeSections";
import FollowCounts from "./FollowCounts";
import SearchBox from "./SearchBox";
import { JobsHome, JobsPage } from "./JobsSection";
import SchoolButton from "./SchoolButton";
import { useCourseCatalog } from "./CourseCatalog";
import CatalogPhoto, { CatalogsHome } from "./CatalogPhoto";
import { BottomNav, BellButton, SecondaryMenu } from "./BottomNav";
import PendingReferral from "./PendingReferral";
import { HeaderBalance } from "./ReferralBadge";
import ReferralPanel from "./ReferralPanel";
import ReferralBadge from "./ReferralBadge";
import { CatalogPage } from "./CatalogPages";
import HomeAnnouncement from "./HomeAnnouncement";
import LearnerVideos from "./LearnerVideos";
import { playPing } from "./sound";
import NewsSection from "./NewsSection";
import CoordinatorPanel from "./CoordinatorPanel";
import ImageLibrarySection from "./ImageLibrarySection";
import { CourseEnrollModal, ForgotPasswordModal, PasswordRecoveryModal, ServiceManager } from "./Step2";
import "./styles.css";
import "./responsive-mobile.css";
import "./premium.css";

/* =====================================================
   ED BUSINESS CENTER
   Application principale
   PARTIE 1 : CONFIGURATION ET DONNÉES
===================================================== */

/* Chemin des images */
const image = (filename) => imageUrl(filename);

/* Informations de l'entreprise */
const BRAND = {
  name: "ED BUSINESS CENTER",
  shortName: "ED B-CENTER",
  slogan: "Apprendre, pratiquer, entreprendre !",
  description:
    "Un centre dédié à l'apprentissage pratique, au développement des compétences et à l'accompagnement vers l'entrepreneuriat.",
  email: "edbusinesscenter@gmail.com",
  phone: "+237 690 418 794",
  whatsapp: "https://wa.me/237690418794",
  facebook:
    "https://www.facebook.com/profile.php?id=61595517983213",
  instagram:
    "https://www.instagram.com/edbcenter?psln=MXJlcjVhYXY5aXRjNg==",
};

/* Réseaux sociaux */
const SOCIALS = [
  {
    name: "WhatsApp",
    image: "logo-ed-b-center.png",
    url: BRAND.whatsapp,
    description: "Contacter l'équipe ED BUSINESS CENTER sur WhatsApp",
  },
  {
    name: "Facebook",
    image: "logo-ed-b-center.png",
    url: BRAND.facebook,
    description: "Retrouver ED BUSINESS CENTER sur Facebook",
  },
  {
    name: "Instagram",
    image: "logo-ed-b-center.png",
    url: BRAND.instagram,
    description: "Découvrir les activités d'ED BUSINESS CENTER sur Instagram",
  },
  {
    name: "Gmail",
    image: "logo-ed-b-center.png",
    url: `mailto:${BRAND.email}`,
    description: "Envoyer un e-mail à ED BUSINESS CENTER",
  },
];

/* =====================================================
   CARROUSEL DE MOTIVATION
   Ces quatre images sont réservées à cette section.
===================================================== */

const MOTIVATION_IMAGES = [
  { image: "motivation-01-discipline-et-perseverance.png", title: "Discipline et persévérance", text: "Les progrès durables se construisent par des actions régulières.", alt: "Illustration de discipline et de persévérance." },
  { image: "motivation-02-formation-et-competences.png", title: "Forme-toi et développe tes compétences", text: "Chaque apprentissage peut ouvrir de nouvelles possibilités professionnelles.", alt: "Illustration de formation et de compétences." },
  { image: "motivation-03-passer-a-laction.png", title: "Passe à l'action", text: "Apprends, entraîne-toi et développe des réalisations concrètes.", alt: "Illustration du passage à l'action." },
  { image: "motivation-04-entrepreneuriat-et-reussite.png", title: "Entreprendre pour progresser", text: "Transforme les compétences acquises en projets concrets.", alt: "Illustration de l'entrepreneuriat et de la réussite." },
  { image: "motivation-05-croire-en-son-potentiel.png", title: "Crois en ton potentiel", text: "La progression demande de la patience et de la volonté.", alt: "Illustration de confiance en son potentiel." },
  { image: "motivation-06-apprendre-et-progresser.png", title: "Apprends et progresse", text: "Chaque exercice est une occasion de mieux maîtriser une compétence.", alt: "Illustration de l'apprentissage et de la progression." },
  { image: "motivation-07-transformer-ses-idees-en-projets.png", title: "Transforme tes idées en projets", text: "Réfléchis, planifie et prépare tes prochaines actions.", alt: "Illustration de transformation des idées en projets." },
  { image: "motivation-08-construire-son-avenir.png", title: "Construis ton avenir", text: "Prépare ton avenir avec des compétences utiles et des actions concrètes.", alt: "Illustration de construction de son avenir." },
  { image: "motivation-09-investir-en-soi.png", title: "Investis en toi", text: "Le temps consacré à apprendre peut devenir un investissement professionnel.", alt: "Illustration de l'investissement en soi." },
  { image: "motivation-10-oser-commencer.png", title: "Ose commencer", text: "Un premier pas concret vaut mieux qu'un projet toujours repoussé.", alt: "Illustration du courage de commencer." },
  { image: "motivation-11-competences-et-opportunites.png", title: "Compétences et opportunités", text: "Développe des savoir-faire qui répondent à des besoins réels.", alt: "Illustration de compétences et d'opportunités." },
  { image: "motivation-12-apprendre-pratiquer-entreprendre.png", title: "Apprendre, pratiquer, entreprendre", text: "La pratique aide à transformer les connaissances en réalisations.", alt: "Illustration du slogan ED BUSINESS CENTER." },
];

/* =====================================================
   SERVICES ED BUSINESS CENTER
===================================================== */

const SERVICES = [
  {
    id: "academy",
    name: "ED B-ACADEMY",
    category: "Formation pratique",
    image: "service-ed-b-academy.png",
    description:
      "Des formations orientées vers la pratique, la réalisation de projets et le développement de compétences utiles.",
    details: [
      "Infographie et intelligence artificielle",
      "Sourcing en Chine",
      "Excel et outils numériques",
      "Exercices pratiques et projets",
    ],
  },
  {
    id: "consulting",
    name: "ED B-CONSULTING",
    category: "Conseil et accompagnement",
    image: "service-ed-b-consulting.png",
    description:
      "Un accompagnement pour mieux structurer tes idées, préparer tes projets et identifier des solutions adaptées.",
    details: [
      "Conseils pour les projets",
      "Accompagnement entrepreneurial",
      "Organisation des activités",
      "Orientation vers des solutions pratiques",
    ],
  },
  {
    id: "digital",
    name: "ED DIGITAL SERVICE",
    category: "Communication digitale",
    image: "service-ed-digital-service.png",
    description:
      "Des solutions de communication visuelle et digitale pour valoriser les activités des particuliers et des entreprises.",
    details: [
      "Création de visuels publicitaires",
      "Contenus pour les réseaux sociaux",
      "Identité visuelle",
      "Supports de communication",
    ],
  },
  {
    id: "sourcing",
    name: "ED B-SOURCING",
    category: "Recherche et approvisionnement",
    image: "service-ed-b-sourcing.png",
    description:
      "Un service de recherche de produits, de comparaison de fournisseurs et d'accompagnement des commandes, notamment depuis la Chine.",
    details: [
      "Recherche de produits",
      "Comparaison des offres",
      "Estimation des coûts",
      "Accompagnement des commandes",
    ],
  },
  {
    id: "solution",
    name: "ED B-SOLUTIONS",
    category: "Solutions numériques",
    image: "service-ed-b-solutions.png",
    description:
      "Des solutions numériques destinées à faciliter certaines activités et à améliorer l'organisation du travail.",
    details: [
      "Solutions numériques adaptées",
      "Appui aux activités professionnelles",
      "Organisation des informations",
      "Accompagnement dans les usages numériques",
    ],
  },
  {
    id: "reseau",
    name: "LE RÉSEAU",
    category: "Recherche de produits et petites commandes",
    image: "service-le-reseau.png",
    description:
      "Un intermédiaire unique pour rechercher des produits, organiser les précommandes et proposer de petits stocks sans exposer directement les fournisseurs.",
    details: [
      "Recherche de produits et fournisseurs",
      "Précommandes et petits stocks",
      "Prix annoncé tout compris",
      "Accompagnement des commandes",
    ],
  },
];

/* =====================================================
   FORMATIONS ET TARIFS
===================================================== */

const COURSES = [
  {
    id: "infographie-ia",
    title: "Infographie & Intelligence artificielle",
    category: "Création numérique",
    image: "course-infographie-ia.png",
    price: 80000,
    oldPrice: null,
    duration: "2 mois",
    description:
      "Apprends à concevoir des visuels publicitaires et à utiliser l'intelligence artificielle pour améliorer ta production.",
    skills: [
      "Création de visuels",
      "Affiches publicitaires",
      "Utilisation pratique de l'IA",
      "Réalisation d'un mini-portfolio",
    ],
  },
  {
    id: "sourcing-chine",
    title: "Sourcing en Chine",
    category: "Commerce et approvisionnement",
    image: "course-sourcing-chine.png",
    price: 50000,
    oldPrice: 80000,
    duration: "2 mois",
    description:
      "Découvre comment rechercher des produits, comparer les fournisseurs, estimer les coûts et préparer une commande.",
    skills: [
      "Recherche de produits",
      "Comparaison des fournisseurs",
      "Évaluation des risques",
      "Calcul des coûts d'approvisionnement",
    ],
  },
  {
    id: "excel",
    title: "Excel",
    category: "Bureautique et gestion",
    image: "course-excel.png",
    price: 80000,
    oldPrice: null,
    duration: "2 mois",
    description:
      "Développe tes compétences sur Excel pour organiser les données et réaliser des calculs utiles aux activités professionnelles.",
    skills: [
      "Tableaux et formules",
      "Organisation des données",
      "Calculs automatisés",
      "Exercices pratiques",
    ],
  },
  {
    id: "power-bi",
    title: "Power BI",
    category: "Analyse des données",
    image: "course-power-bi.png",
    price: 85000,
    oldPrice: 110000,
    duration: "2 mois",
    description:
      "Apprends à transformer des données en rapports visuels et en tableaux de bord pour faciliter la prise de décision.",
    skills: [
      "Importation des données",
      "Création de rapports",
      "Visualisations",
      "Tableaux de bord",
    ],
  },
  {
    id: "big-data",
    title: "Big Data",
    category: "Données et analyse",
    image: "course-big-data.png",
    price: 125000,
    oldPrice: null,
    duration: "2 mois",
    description:
      "Découvre les principes de l'analyse de grands volumes de données et leurs applications dans les organisations.",
    skills: [
      "Compréhension du Big Data",
      "Préparation des données",
      "Analyse des informations",
      "Applications professionnelles",
    ],
  },
];

/* =====================================================
   OUTILS UTILITAIRES
===================================================== */

/* Affichage des prix en FCFA */
function formatPrice(price) {
  if (price === null || price === undefined) {
    return "Prix à confirmer";
  }

  return `${Number(price).toLocaleString("fr-FR")} FCFA`;
}

/* Initiales pour les avatars sans photo */
function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "ED";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/* Vérification d'une erreur liée à une table absente */
function isMissingTableError(error) {
  if (!error) {
    return false;
  }

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "PGRST204"
  );
     }

/* =====================================================
   BADGE DES RÔLES VÉRIFIÉS
===================================================== */

function VerifiedBadge({ role }) {
  if (!role || role === "client") {
    return null;
  }

  const label =
    role === "admin"
      ? "Administrateur"
      : role === "trainer"
      ? "Formateur"
      : role === "apprenant"
      ? "Apprenant"
      : role;

  return (
    <span
      className="verified-badge"
      title={`Compte ${label}`}
      aria-label={`Compte ${label} vérifié`}
    >
      <span className="verified-badge-icon">✓</span>
      <span>{label}</span>
    </span>
  );
}

/* =====================================================
   AVATAR UTILISATEUR
===================================================== */

function UserAvatar({ user, size = "medium", role }) {
  const name =
    user?.full_name ||
    user?.name ||
    user?.email ||
    "Utilisateur";

  const photo =
    user?.avatar_url ||
    user?.profile_photo ||
    user?.photo_url ||
    "";

  return (
    <div
      className={`user-avatar user-avatar-${size}`}
      title={name}
      aria-label={`Photo de profil de ${name}`}
    >
      {photo ? (
        <img src={photo} alt={`Portrait de ${name}`} loading="lazy" />
      ) : ["trainer", "formatrice", "formateur"].includes(String(role || user?.role || user?.user_role || "").toLowerCase()) ? (
        <img src={image("avatar-default-formatrice.png")} alt="Avatar par défaut de la formatrice" loading="lazy" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
/* =====================================================
   EN-TÊTE DU SITE
===================================================== */

function Header({
  user,
  profile,
  unreadNotifications = 0,
  onLogin,
  onRegister,
  onLogout,
  onNavigate,
  activePage,
  role,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { id: "home", label: "Accueil" },
    { id: "services", label: "Nos services" },
    { id: "courses", label: "Formations" },
    { id: "news", label: "Actualités" },
    { id: "community", label: "Communauté" },
    { id: "atelier", label: "Ateliers" },
    { id: "contact", label: "Contact" },
    ...(role === "admin" ? [{ id: "images", label: "Gestion des images" }] : []),
  ];

  function navigateTo(page) {
    onNavigate(page);
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="brand-button"
          type="button"
          onClick={() => navigateTo("home")}
          aria-label="Retour à l'accueil"
        >
          <img
            className="brand-logo"
            src={image("logo-ed-b-center.png")}
            alt="Logo ED BUSINESS CENTER"
          />

          <span className="brand-text">
            <strong>ED BUSINESS CENTER</strong>
            <small>Apprendre, pratiquer, entreprendre !</small>
          </span>
        </button>

        <span className="header-tools"><HeaderBalance /><BellButton /><SecondaryMenu /></span>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((previous) => !previous)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav
          className={`main-navigation ${
            menuOpen ? "navigation-open" : ""
          }`}
          aria-label="Navigation principale"
        >
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`navigation-link ${
                activePage === link.id ? "navigation-link-active" : ""
              }`}
              onClick={() => navigateTo(link.id)}
            >
              {link.label}
            </button>
          ))}

          {user ? (
            <>
              <button
                type="button"
                className={`navigation-link notification-nav ${
                  activePage === "notifications" ? "navigation-link-active" : ""
                }`}
                onClick={() => navigateTo("notifications")}
                aria-label={`Notifications, ${unreadNotifications} non lues`}
              >
                ♧ Notifications
                {unreadNotifications > 0 && (
                  <span className="notification-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
                )}
              </button>
              <button type="button" className={`navigation-link ${activePage === "messages" ? "navigation-link-active" : ""}`} onClick={() => navigateTo("messages")}>✉ Messagerie</button>
              <span className="header-points" title="Points gagnés sur les publications">★ {Number(profile?.points || 0)}</span>
              <button
                type="button"
                className={`navigation-link ${
                  activePage === "account" ? "navigation-link-active" : ""
                }`}
                onClick={() => navigateTo("account")}
              >
                Mon espace
              </button>

              <button
                type="button"
                className="button button-outline header-action"
                onClick={onLogout}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className="header-auth-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setMenuOpen(false);
                  onLogin();
                }}
              >
                Connexion
              </button>

              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setMenuOpen(false);
                  onRegister();
                }}
              >
                Créer un compte
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

/* =====================================================
   CARROUSEL DE MOTIVATION
===================================================== */

function MotivationCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((previous) =>
        (previous + 1) % MOTIVATION_IMAGES.length
      );
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = MOTIVATION_IMAGES[currentIndex];

  function showPrevious() {
    setCurrentIndex(
      (previous) =>
        (previous - 1 + MOTIVATION_IMAGES.length) %
        MOTIVATION_IMAGES.length
    );
  }

  function showNext() {
    setCurrentIndex(
      (previous) => (previous + 1) % MOTIVATION_IMAGES.length
    );
  }

  return (
    <section
      className="motivation-carousel"
      aria-label="Motivation et entrepreneuriat"
    >
      <div className="motivation-image-wrapper">
        <img
          key={currentSlide.image}
          className="motivation-image"
          src={image(currentSlide.image)}
          alt={currentSlide.alt}
        />

        <div className="motivation-overlay">
          <span className="eyebrow">
            ED BUSINESS CENTER
          </span>

          <h2>{currentSlide.title}</h2>

          <p>{currentSlide.text}</p>

          <div className="motivation-actions">
            <a
              className="button button-light"
              href={BRAND.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Parlons de ton projet
            </a>
          </div>
        </div>

        <button
          type="button"
          className="carousel-arrow carousel-arrow-left"
          onClick={showPrevious}
          aria-label="Image précédente"
        >
          ‹
        </button>

        <button
          type="button"
          className="carousel-arrow carousel-arrow-right"
          onClick={showNext}
          aria-label="Image suivante"
        >
          ›
        </button>

        <div
          className="carousel-indicators"
          aria-label="Choisir une image"
        >
          {MOTIVATION_IMAGES.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={`carousel-indicator ${
                index === currentIndex ? "indicator-active" : ""
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Afficher l'image ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
/* =====================================================
   SECTION DE PRÉSENTATION
===================================================== */

function IntroSection({ onNavigate, onRegister }) {
  return (
    <section className="intro-section section-container" id="intro">
      <div className="intro-content">
        <span className="eyebrow">
          BIENVENUE CHEZ ED B-CENTER
        </span>

        <h1>
          Développe tes compétences.
          <span> Transforme-les en opportunités.</span>
        </h1>

        <p className="intro-description">
          ED BUSINESS CENTER accompagne les personnes qui souhaitent
          apprendre des compétences pratiques, réaliser des projets
          concrets et explorer des possibilités professionnelles.
        </p>

        <p className="intro-description">
          Notre approche associe apprentissage, pratique et
          accompagnement pour t'aider à mieux préparer tes prochaines
          étapes.
        </p>

        <div className="intro-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => onNavigate("courses")}
          >
            Découvrir les formations
          </button>

          <button
            type="button"
            className="button button-outline"
            onClick={() => window.open("https://whatsapp.com/channel/0029VbDMmDnC1FuDUIDiXm25", "_blank", "noopener,noreferrer")}
          >
            Rejoindre la communauté
          </button>
        </div>

        <div className="intro-highlights">
          <div className="intro-highlight">
            <span className="highlight-number">01</span>
            <span>
              <strong>Apprendre</strong>
              <small>Acquérir des compétences</small>
            </span>
          </div>

          <div className="intro-highlight">
            <span className="highlight-number">02</span>
            <span>
              <strong>Pratiquer</strong>
              <small>Réaliser des exercices concrets</small>
            </span>
          </div>

          <div className="intro-highlight">
            <span className="highlight-number">03</span>
            <span>
              <strong>Entreprendre</strong>
              <small>Préparer ses prochaines actions</small>
            </span>
          </div>
        </div>
      </div>

      <div className="intro-visual">
        <div className="intro-image-card">
          <img
            src={image("banniere-ed-b-center.png")}
            alt="Bannière officielle présentant ED BUSINESS CENTER et ses activités"
          />
        </div>

        <div className="intro-decoration" />
      </div>
    </section>
  );
}
/* =====================================================
   CARROUSEL DES SERVICES
===================================================== */

function ServicesSection({ onNavigate, onSelectService }) {
  const [extraServices, setExtraServices] = useState([]);
  const services = [...SERVICES, ...extraServices];

  useEffect(() => {
    let alive = true;
    async function loadExtra() {
      const { data } = await supabase
        .from("services")
        .select("id, name, category, description, image_name, details")
        .eq("is_published", true)
        .order("created_at", { ascending: true });
      if (alive && Array.isArray(data)) {
        setExtraServices(data.map((r) => ({ id: r.id, name: r.name, category: r.category, description: r.description, image: r.image_name || "", details: Array.isArray(r.details) ? r.details : [] })));
      }
    }
    loadExtra();
    window.addEventListener("ed-services-updated", loadExtra);
    return () => { alive = false; window.removeEventListener("ed-services-updated", loadExtra); };
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [visibleCount, setVisibleCount] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches ? 1 : 3
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const updateVisibleCount = () => setVisibleCount(media.matches ? 1 : 3);
    updateVisibleCount();
    media.addEventListener?.("change", updateVisibleCount);
    return () => media.removeEventListener?.("change", updateVisibleCount);
  }, []);

  const maxIndex = Math.max(0, services.length - visibleCount);

  function showPrevious() {
    setCurrentIndex((previous) =>
      previous <= 0 ? maxIndex : previous - 1
    );
  }

  function showNext() {
    setCurrentIndex((previous) =>
      previous >= maxIndex ? 0 : previous + 1
    );
  }

  return (
    <section className="services-section section-container" id="services">
      <div className="section-heading">
        <span className="eyebrow">NOS DOMAINES D'ACTIVITÉ</span>

        <h2>
          Des services pour <span>faire avancer tes projets</span>
        </h2>

        <p>
          Découvre nos différents domaines d'intervention et identifie
          les services qui correspondent à tes besoins.
        </p>
      </div>

      <div className="services-carousel">
        <button
          type="button"
          className="section-carousel-arrow"
          onClick={showPrevious}
          aria-label="Services précédents"
        >
          ‹
        </button>

        <div className="services-track-window">
          <div
            className="services-track"
            style={{
              "--services-index": currentIndex,
              "--services-count": services.length,
              "--services-visible": visibleCount,
            }}
          >
            {services.map((service) => (
              <div className="service-slide" key={service.id}><article className="service-card">
                <div className="service-image-wrapper">
                  <img
                    src={image(service.image)}
                    alt={`${service.name} : ${service.description}`}
                    loading="lazy"
                  />

                  <span className="service-category">
                    {service.category}
                  </span>
                </div>

                <div className="service-card-content">
                  <h3>{service.name}</h3>

                  <p>{service.description}</p>{service.price && <p className="service-price">{service.price}</p>}

                  <ul className="service-details">
                    {service.details.slice(0, 3).map((detail) => (
                      <li key={detail}>
                        <span aria-hidden="true">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      if (onSelectService) {
                        onSelectService(service);
                      } else {
                        onNavigate("contact");
                      }
                    }}
                  >
                    En savoir plus <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article></div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="section-carousel-arrow"
          onClick={showNext}
          aria-label="Services suivants"
        >
          ›
        </button>
      </div>

      <div className="services-mobile-dots">
        {services.map((service, index) => (
          <button
            key={service.id}
            type="button"
            className={`services-dot ${
              index === currentIndex ? "services-dot-active" : ""
            }`}
            onClick={() => setCurrentIndex(Math.min(index, maxIndex))}
            aria-label={`Afficher les services à partir de ${service.name}`}
          />
        ))}
      </div>
    </section>
  );
}
/* =====================================================
   SECTION DES FORMATIONS
===================================================== */

function CoursesSection({ onRegister, onNavigate }) {
  const courses = useCourseCatalog(COURSES);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");

  const categories = [
    "Toutes",
    ...new Set(courses.map((course) => course.category)),
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase()) ||
      course.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "Toutes" ||
      course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <section className="courses-section section-container" id="courses">
      <div className="section-heading">
        <span className="eyebrow">ED B-ACADEMY</span>

        <h2>
          Choisis une formation et <span>passe à la pratique</span>
        </h2>

        <p>
          Explore notre catalogue de formations. Les compétences sont
          abordées à travers des explications, des exercices et des
          réalisations pratiques.
        </p>
      </div>

      <div className="course-search-area">
        <label className="course-search">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Rechercher une formation"
          />
        </label>

        <label className="course-category-filter">
          <span className="visually-hidden">Catégorie de formation</span>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <article className="course-card" key={course.id}>
              <div className="course-image-wrapper">
                <img
                  src={image(course.image)}
                  alt={`Formation ${course.title} proposée par ED BUSINESS CENTER`}
                  loading="lazy"
                />

                <span className="course-duration">
                  {course.duration}
                </span>
              </div>

              <div className="course-card-content">
                <span className="course-category">
                  {course.category}
                </span>

                <h3>{course.title}</h3>

                <p>{course.description}</p>

                <div className="course-skills">
                  <strong>Ce que tu vas découvrir :</strong>

                  <ul>
                    {course.skills.map((skill) => (
                      <li key={skill}>
                        <span aria-hidden="true">✓</span>
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="course-price-area">
                  <div className="course-price">
                    <strong>{formatPrice(course.price)}</strong>

                    {course.oldPrice && (
                      <del>{formatPrice(course.oldPrice)}</del>
                    )}
                  </div>

                  <button
                    type="button"
                    className="button button-primary course-register-button"
                    onClick={() => onRegister(course)}
                  >
                    M'inscrire
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            ⌕
          </span>

          <h3>Aucune formation trouvée</h3>

          <p>
            Essaie un autre mot-clé ou sélectionne une autre catégorie.
          </p>

          <button
            type="button"
            className="button button-outline"
            onClick={() => {
              setSearch("");
              setSelectedCategory("Toutes");
            }}
          >
            Réinitialiser la recherche
          </button>
        </div>
      )}

      <div className="courses-information">
        <div className="courses-information-icon" aria-hidden="true">
          ✦
        </div>

        <div>
          <h3>Apprendre, c'est aussi pratiquer</h3>

          <p>
            Notre objectif est de favoriser la mise en pratique des
            compétences. Les modalités précises de chaque session,
            les dates et les places disponibles doivent être confirmées
            auprès de notre équipe.
          </p>
        </div>

        <button
          type="button"
          className="button button-outline"
          onClick={() => onNavigate("contact")}
        >
          Poser une question
        </button>
      </div>
    </section>
  );
}
    /* =====================================================
   SECTION CONTACT
===================================================== */

function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Demande d'information",
    message: "",
  });
  const [open, setOpen] = useState(false);

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.message.trim()) {
      setStatus("Veuillez renseigner votre nom et votre message.");
      return;
    }

    const messageText = [
      "Bonjour ED BUSINESS CENTER,",
      "",
      `Nom : ${form.name}`,
      `E-mail : ${form.email || "Non renseigné"}`,
      `Téléphone : ${form.phone || "Non renseigné"}`,
      `Objet : ${form.subject}`,
      "",
      form.message,
    ].join("\n");

    const whatsappUrl =
      `${BRAND.whatsapp}?text=${encodeURIComponent(messageText)}`;

    setLoading(true);
    setStatus(
      "Votre message est prêt. WhatsApp va s'ouvrir pour vous permettre de l'envoyer."
    );

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    setLoading(false);
  }

  return (
    <section className="contact-section section-container" id="contact">
      <div className="section-heading">
        <span className="eyebrow">RESTONS EN CONTACT</span>

        <h2>
          Parlons de <span>ton projet</span>
        </h2>

        <p>
          Tu souhaites suivre une formation, obtenir des informations
          sur un service ou discuter d'un projet ? Contacte notre équipe.
        </p>
      </div>

      <div className="contact-layout">
        <div className="contact-information">
          <div className="contact-brand">
            <img
              src={image("logo-ed-b-center.png")}
              alt="Logo ED BUSINESS CENTER"
            />

            <div>
              <h3>ED BUSINESS CENTER</h3>
              <p>Apprendre, pratiquer, entreprendre !</p>
            </div>
          </div>

          <p className="contact-intro">
            Nous privilégions une approche pratique et un échange
            clair afin de mieux comprendre tes besoins.
          </p>

          <div className="contact-detail">
            <span className="contact-detail-icon" aria-hidden="true">
              ✉
            </span>

            <div>
              <strong>E-mail</strong>
              <a href={`mailto:${BRAND.email}`}>
                {BRAND.email}
              </a>
            </div>
          </div>

          <div className="contact-detail">
            <span className="contact-detail-icon" aria-hidden="true">
              ☎
            </span>

            <div>
              <strong>Téléphone</strong>
              <a href="tel:+237690418794">
                {BRAND.phone}
              </a>
            </div>
          </div>

          <a
            href={BRAND.whatsapp}
            className="button button-whatsapp"
            target="_blank"
            rel="noreferrer"
          >
            Contacter sur WhatsApp
          </a>

          <div className="contact-socials">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                title={social.description}
                aria-label={social.description}
              >
                <span className={`social-fallback-mark social-${social.name.toLowerCase()}`} aria-hidden="true">
                  {social.name === "WhatsApp" ? "WA" : social.name === "Facebook" ? "f" : social.name === "Instagram" ? "◎" : "@"}
                </span>
              </a>
            ))}
          </div>
        </div>

        {open ? (
        <form className="contact-form" onSubmit={(event) => { handleSubmit(event); setOpen(false); }}>
          <button type="button" className="contact-close" onClick={() => setOpen(false)}>Fermer</button>
          <h3>Envoie-nous un message</h3>

          <p>
            Complète le formulaire. Tu pourras ensuite envoyer ton
            message par WhatsApp.
          </p>

          <div className="form-field">
            <label htmlFor="contact-name">Nom complet *</label>

            <input
              id="contact-name"
              name="name"
              type="text"
              value={form.name}
              onChange={updateField}
              placeholder="Ton nom complet"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="contact-email">Adresse e-mail</label>

              <input
                id="contact-email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="nom@exemple.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-phone">Téléphone</label>

              <input
                id="contact-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={updateField}
                placeholder="+237..."
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="contact-subject">Objet</label>

            <select
              id="contact-subject"
              name="subject"
              value={form.subject}
              onChange={updateField}
            >
              <option>Demande d'information</option>
              <option>Inscription à une formation</option>
              <option>Service de sourcing</option>
              <option>Communication digitale</option>
              <option>Photographie</option>
              <option>Partenariat</option>
              <option>Autre demande</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="contact-message">Ton message *</label>

            <textarea
              id="contact-message"
              name="message"
              value={form.message}
              onChange={updateField}
              placeholder="Explique-nous ton besoin..."
              rows={5}
              required
            />
          </div>

          {status && (
            <p className="form-status" role="status">
              {status}
            </p>
          )}

          <button
            type="submit"
            className="button button-primary button-full"
            disabled={loading}
          >
            {loading ? "Préparation..." : "Continuer sur WhatsApp"}
          </button>

          <small className="form-note">
            L'envoi final du message se fait dans WhatsApp.
          </small>
        </form>
        ) : (
          <button type="button" className="button button-primary contact-open" onClick={() => setOpen(true)}>Envoyez-nous un message</button>
        )}
      </div>
    </section>
  );
}

/* =====================================================
   FENÊTRE DE CONNEXION
===================================================== */

function LoginModal({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);

  if (forgot) {
    return <ForgotPasswordModal onClose={onClose} onBack={() => setForgot(false)} />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (data?.user) {
        await onLoginSuccess(data.user);
      }

      onClose();
    } catch (err) {
      setError(
        err?.message ||
          "Connexion impossible. Vérifie tes informations et réessaie."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Fermer la fenêtre"
        >
          ×
        </button>

        <div className="auth-modal-brand">
          <img
            src={image("logo-ed-b-center.png")}
            alt="Logo ED BUSINESS CENTER"
          />
        </div>

        <span className="eyebrow">HEUREUX DE TE REVOIR</span>

        <h2 id="login-title">Connexion</h2>

        <p className="auth-description">
          Connecte-toi pour accéder à ton espace personnel.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="login-email">Adresse e-mail</label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nom@exemple.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Mot de passe</label>

            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ton mot de passe"
              required
            />
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button button-primary button-full"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <p className="auth-switch">
          <button type="button" className="text-button" onClick={() => setForgot(true)}>Mot de passe oublié ?</button>
        </p>

        <p className="auth-switch">
          Tu n'as pas encore de compte ?
          <button
            type="button"
            className="text-button"
            onClick={onSwitchToRegister}
          >
            Créer un compte
          </button>
        </p>
      </section>
    </div>
  );
}

/* =====================================================
   FENÊTRE DE CRÉATION DE COMPTE
===================================================== */

function RegisterModal({
  onClose,
  onSwitchToLogin,
  onRegisterSuccess,
  selectedCourse,
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    sex: "",
    password: "",
    confirmPassword: "",
    referral: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
         setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (form.password.length < 6) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    if (form.referral.trim()) {
      try { sessionStorage.setItem("ed-pending-ref", form.referral.trim().toUpperCase()); } catch (e) { /* ignoré */ }
    }
    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.full_name.trim(),
              phone: form.phone.trim(),
              sex: form.sex,
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user && data.session) {
        await onRegisterSuccess(data.user, {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          sex: form.sex,
        });

        setSuccess("Ton compte a été créé avec succès.");

        window.setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSuccess(
          "Ton inscription a été enregistrée. Consulte ta boîte e-mail pour confirmer ton adresse avant de te connecter."
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "La création du compte a échoué. Réessaie dans quelques instants."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="auth-modal register-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Fermer la fenêtre"
        >
          ×
        </button>

        <div className="auth-modal-brand">
          <img
            src={image("logo-ed-b-center.png")}
            alt="Logo ED BUSINESS CENTER"
          />
        </div>

        <span className="eyebrow">REJOINS NOTRE COMMUNAUTÉ</span>

        <h2 id="register-title">Créer un compte</h2>

        <p className="auth-description">
          Crée ton espace personnel pour suivre tes démarches et tes
          formations.
        </p>

        {selectedCourse && (
          <div className="selected-course-notice">
            <strong>Formation sélectionnée :</strong>
            <span>{selectedCourse.title}</span>
            <span>{formatPrice(selectedCourse.price)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="register-name">Nom complet</label>

            <input
              id="register-name"
              name="full_name"
              type="text"
              autoComplete="name"
              value={form.full_name}
              onChange={updateField}
              placeholder="Ton nom complet"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-email">Adresse e-mail</label>

            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              placeholder="nom@exemple.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-referral">Code de parrainage (facultatif)</label>
            <input
              id="register-referral"
              name="referral"
              type="text"
              autoCapitalize="characters"
              value={form.referral}
              onChange={updateField}
              placeholder="ED-B0000000"
              maxLength={10}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="register-phone">Téléphone</label>

              <input
                id="register-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={updateField}
                placeholder="+237..."
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-sex">Sexe</label>

              <select
                id="register-sex"
                name="sex"
                value={form.sex}
                onChange={updateField}
              >
                <option value="">Non précisé</option>
                <option value="F">Féminin</option>
                <option value="M">Masculin</option>
                <option value="other">Autre</option>
                <option value="prefer_not_to_say">
                  Je préfère ne pas préciser
                </option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="register-password">Mot de passe</label>

            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={form.password}
              onChange={updateField}
              placeholder="6 caractères minimum"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-confirm-password">
              Confirmer le mot de passe
            </label>

            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={updateField}
              placeholder="Saisis à nouveau ton mot de passe"
              required
            />
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="form-success" role="status">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="button button-primary button-full"
            disabled={loading}
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>

          <small className="form-note">
            Ton compte doit être créé et confirmé selon les paramètres
            d'authentification de Supabase.
          </small>
        </form>

        <p className="auth-switch">
          Tu as déjà un compte ?
          <button
            type="button"
            className="text-button"
            onClick={onSwitchToLogin}
          >
            Se connecter
          </button>
        </p>
      </section>
    </div>
  );
}

/* =====================================================
   ESPACE PERSONNEL
===================================================== */

function AccountSection({
  user,
  profile,
  role,
  onNavigate,
  onLogout,
  onEditProfile,
  onPlatformStatusChange,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Utilisateur";

  const points = Number(profile?.points || 0);

  const roleLabel =
    role === "admin"
      ? "Administrateur"
      : role === "trainer"
      ? "Formateur"
      : role === "apprenant"
      ? "Apprenant"
      : "Membre";

  return (
    <section className="account-section section-container">
      <div className="account-welcome">
        <div className="account-welcome-content">
          <span className="eyebrow">ESPACE PERSONNEL</span>

          <h1>
            Bienvenue, <span>{displayName}</span>
          </h1>

          <p>
            Retrouve ici les informations de ton compte et les
            fonctionnalités disponibles selon ton profil.
          </p>
        </div>

        <UserAvatar
          user={{ ...profile, ...user, full_name: displayName }}
          role={role}
          size="large"
        />
      </div>

      <div className="account-layout">
        <aside className="account-sidebar">
          <div className="account-profile-card">
            <UserAvatar
              user={{ ...profile, ...user, full_name: displayName }}
              size="large"
            />
            <FollowCounts onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} />
            <SchoolButton onOpen={() => setActiveTab("learner")} />
            <ReferralBadge />

            <h3>{displayName}</h3>

            <p>{user?.email}</p>

            <VerifiedBadge role={role} />

            <span className="account-role-label">
              {roleLabel}
            </span>
          </div>

          <nav
            className="account-navigation"
            aria-label="Menu personnel"
          >
            <button
              type="button"
              className={
                activeTab === "overview" ? "account-nav-active" : ""
              }
              onClick={() => setActiveTab("overview")}
            >
              <span aria-hidden="true">⌂</span>
              Vue d'ensemble
            </button>

            <button
              type="button"
              className={
                activeTab === "profile" ? "account-nav-active" : ""
              }
              onClick={() => setActiveTab("profile")}
            >
              <span aria-hidden="true">◉</span>
              Mon profil
            </button>

            <button
              type="button"
              className={
                activeTab === "courses" ? "account-nav-active" : ""
              }
              onClick={() => setActiveTab("courses")}
            >
              <span aria-hidden="true">▤</span>
              Formations
            </button>

            <button
              type="button"
              className={
                activeTab === "messages" ? "account-nav-active" : ""
              }
              onClick={() => setActiveTab("messages")}
            >
              <span aria-hidden="true">✉</span>
              Messagerie
            </button>


            {role === "apprenant" && (
              <button type="button" className={activeTab === "learner" ? "account-nav-active" : ""} onClick={() => setActiveTab("learner")}>
                <span aria-hidden="true">★</span>
                Mon parcours
              </button>
            )}
            {(role === "trainer" || role === "admin") && (
              <button type="button" className={activeTab === "trainer" ? "account-nav-active" : ""} onClick={() => setActiveTab("trainer")}>
                <span aria-hidden="true">✎</span>
                Espace formateur
              </button>
            )}

            {["apprenant", "trainer", "admin"].includes(role) && (
              <button
                type="button"
                className={activeTab === "learning" ? "account-nav-active" : ""}
                onClick={() => setActiveTab("learning")}
              >
                <span aria-hidden="true">✎</span>
                {role === "apprenant" ? "Mon parcours" : "Apprenants"}
              </button>
            )}

            {(role === "admin" || role === "trainer") && (
              <button
                type="button"
                className={
                  activeTab === "admin" ? "account-nav-active" : ""
                }
                onClick={() => setActiveTab("admin")}
              >
                <span aria-hidden="true">⚙</span>
                Administration
              </button>
            )}

            <button
              type="button"
              className={activeTab === "coordinator" ? "account-nav-active" : ""}
              onClick={() => setActiveTab("coordinator")}
            >
              <span aria-hidden="true">🛡</span>
              Sécurité plateforme
            </button>
          </nav>

          <button
            type="button"
            className="account-logout-button"
            onClick={onLogout}
          >
            ↪ Déconnexion
          </button>
        </aside>

        <div className="account-main">
          {activeTab === "overview" && (
            <div className="account-tab-content">
              <div className="account-section-title">
                <div>
                  <span className="eyebrow">TABLEAU DE BORD</span>
                  <h2>Vue d'ensemble</h2>
                </div>

                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => onNavigate("home")}
                >
                  Retour à l'accueil
                </button>
              </div>

              <div className="account-stat-grid">
                <article className="account-stat-card">
                  <span className="account-stat-icon">★</span>
                  <div>
                    <span className="account-stat-label">
                      Mes points
                    </span>
                    <strong className="points-bubble">{points}</strong>
                  </div>
                </article>

                <article className="account-stat-card">
                  <span className="account-stat-icon">▤</span>
                  <div>
                    <span className="account-stat-label">
                      Formations
                    </span>
                    <strong>Découvrir</strong>
                  </div>
                </article>

                <article className="account-stat-card">
                  <span className="account-stat-icon">✉</span>
                  <div>
                    <span className="account-stat-label">
                      Messagerie
                    </span>
                    <strong>Mes messages</strong>
                  </div>
                </article>
              </div>

              <div className="account-content-card">
                <h3>Bienvenue dans ton espace</h3>

                <p>
                  Tu peux consulter les formations proposées par
                  ED B-CENTER, mettre à jour tes informations et
                  contacter notre équipe.
                </p>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => onNavigate("courses")}
                >
                  Explorer les formations
                </button>
              </div>

              {role === "admin" && (
                <div className="account-content-card admin-highlight">
                  <span className="eyebrow">ESPACE ADMINISTRATEUR</span>

                  <h3>Gestion de la plateforme</h3>

                  <p>
                    Ton compte possède le rôle administrateur reconnu
                    par le système. Les fonctions de gestion avancée
                    seront activées selon la configuration de la base
                    de données.
                  </p>

                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => setActiveTab("admin")}
                  >
                    Ouvrir l'administration
                  </button>
                </div>
              )}
            </div>
          )}
                     {activeTab === "profile" && (
            <div className="account-tab-content">
              <div className="account-section-title">
                <div>
                  <span className="eyebrow">MES INFORMATIONS</span>
                  <h2>Mon profil</h2>
                </div>
              </div>

              <div className="account-content-card profile-details-card">
                <img className="account-feature-preview" src={image("interface-profil-public.png")} alt="Aperçu des profils sur ED BUSINESS CENTER" loading="lazy" />
                <div className="profile-detail-row">
                  <span>Nom complet</span>
                  <strong>{displayName}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Adresse e-mail</span>
                  <strong>{user?.email || "Non renseignée"}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Téléphone</span>
                  <strong>
                    {profile?.phone ||
                      user?.user_metadata?.phone ||
                      "Non renseigné"}
                  </strong>
                </div>

                <div className="profile-detail-row">
                  <span>Rôle</span>
                  <strong>{roleLabel}</strong>
                </div>

                <div className="profile-detail-row">
                  <span>Points</span>
                  <strong>{points}</strong>
                </div>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={onEditProfile}
                >
                  Modifier mon profil
                </button>
              </div>
            <DeleteAccount onDeleted={onLogout} onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} />
            </div>
          )}

          {activeTab === "courses" && (
            <div className="account-tab-content">
              <div className="account-section-title">
                <div>
                  <span className="eyebrow">APPRENTISSAGE</span>
                  <h2>Les formations</h2>
                </div>
              </div>

              <div className="account-content-card">
                <h3>Développe tes compétences</h3>

                <p>
                  Consulte les formations disponibles et contacte
                  l'équipe pour connaître les modalités d'inscription,
                  les dates et les places disponibles.
                </p>

                <div className="account-course-list">
                  {COURSES.map((course) => (
                    <div className="account-course-item" key={course.id}>
                      <img
                        src={image(course.image)}
                        alt={`Illustration de ${course.title}`}
                        loading="lazy"
                      />

                      <div>
                        <strong>{course.title}</strong>
                        <span>{course.duration}</span>
                      </div>

                      <strong>{formatPrice(course.price)}</strong>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => onNavigate("courses")}
                >
                  Voir le catalogue
                </button>
              </div>
            </div>
          )}

          {activeTab === "learning" && ["apprenant", "trainer", "admin"].includes(role) && (
            <div className="account-tab-content">
              <div className="account-section-title">
                <div>
                  <span className="eyebrow">SUIVI DES APPRENANTS</span>
                  <h2>{role === "apprenant" ? "Mon parcours" : "Gestion des apprenants"}</h2>
                </div>
              </div>
              {role === "apprenant"
                ? <Parcours user={user} onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} />
                : <ParcoursManager user={user} role={role} onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} />}
            </div>
          )}

          {activeTab === "learner" && role === "apprenant" && (
            <div className="account-tab-content">
              <div className="account-section-title"><div><span className="eyebrow">ESPACE APPRENANT</span><h2>Mon parcours</h2></div></div>
              <Parcours user={user} onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} />
            </div>
          )}

          {activeTab === "trainer" && (role === "trainer" || role === "admin") && (
            <div className="account-tab-content">
              <div className="account-section-title"><div><span className="eyebrow">SUIVI DES APPRENANTS</span><h2>Espace formateur</h2></div></div>
              <ParcoursManager user={user} role={role} onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} />
            </div>
          )}

          {activeTab === "network" && (
            <div className="account-tab-content">
              <div className="account-section-title">
                <div>
                  <span className="eyebrow">COMMUNAUTÉ</span>
                  <h2>Mon réseau</h2>
                </div>
              </div>
              <FollowLists onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} />
            </div>
          )}

          {activeTab === "messages" && (
            <div className="account-tab-content">
              <div className="account-section-title">
                <div>
                  <span className="eyebrow">COMMUNICATION</span>
                  <h2>Ma messagerie</h2>
                </div>
              </div>
              <Messenger
                user={user}
                role={role}
                onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))}
              />
            </div>
          )}

          {activeTab === "coordinator" && (
            <div className="account-tab-content">
              <CoordinatorPanel onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} onStatusChange={onPlatformStatusChange} />
            </div>
          )}

          {activeTab === "admin" && (role === "admin" || role === "trainer") && (
            <AdminSpace user={user} catalog={{ courses: COURSES.map((c) => ({ key: c.id, label: c.title, price: c.price, old: c.oldPrice })), services: SERVICES.map((s) => ({ key: s.id, label: s.name, text: s.price || "" })) }} onNotify={(message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }))} />
          )}
        </div>
      </div>
    </section>
  );
}

/* =====================================================
   MODIFICATION DU PROFIL
===================================================== */

function EditProfileModal({ user, profile, onClose, onSave }) {
  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ""
  );

  const [phone, setPhone] = useState(
    profile?.phone || user?.user_metadata?.phone || ""
  );

  const [photoFile, setPhotoFile] = useState(null);

  const [preview, setPreview] = useState(
    profile?.avatar_url ||
      user?.user_metadata?.avatar_url ||
      profile?.profile_photo ||
      ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!photoFile) return;

    const objectUrl = URL.createObjectURL(photoFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Veuillez renseigner votre nom complet.");
      return;
    }

    setLoading(true);

    try {
      await onSave({
        full_name: fullName.trim(),
        phone: phone.trim(),
        photoFile,
      });

      onClose();
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer le profil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>

        <h2>Modifier mon profil</h2>
        <p>Actualisez vos informations personnelles.</p>

        <form onSubmit={handleSubmit}>
          <div className="profile-photo-editor">
            {preview ? (
              <img
                src={preview}
                alt="Aperçu de la photo de profil"
                className="profile-photo-preview"
              />
            ) : (
              <div className="profile-photo-placeholder">
                {getInitials(fullName)}
              </div>
            )}

            <label className="photo-upload-button">
              Ajouter une photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (!file) return;

                  if (!file.type.startsWith("image/")) {
                    setError("Veuillez sélectionner une image.");
                    return;
                  }

                  if (file.size > 5 * 1024 * 1024) {
                    setError("La photo ne doit pas dépasser 5 Mo.");
                    return;
                  }

                  setError("");
                  setPhotoFile(file);
                }}
              />
            </label>
          </div>

          <label className="form-label">
            Nom complet
            <input
              type="text"
              name="full_name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Téléphone
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
 }
/* =====================================================
   APPLICATION PRINCIPALE
===================================================== */

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("client");

  const [activePage, setActivePage] = useState("home");

  useEffect(() => {
    const handler = (event) => {
      const value = String(event.detail || "");
      const map = { "publication": "community", "workshop": "atelier", "job": "jobs", "messages": "messages", "school": "account" };
      const kind = value.includes(":") ? value.split(":")[0] : "";
      const target = kind ? map[kind] : value;
      if (target) navigateTo(target);
    };
    window.addEventListener("ed-navigate", handler);
    return () => window.removeEventListener("ed-navigate", handler);
  }, []);
  const [authModal, setAuthModal] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollCourse, setEnrollCourse] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [profileView, setProfileView] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const [notification, setNotification] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [platformClosed, setPlatformClosed] = useState(false);
  const [platformClosureMessage, setPlatformClosureMessage] = useState("APPLICATION FERMÉE — maintenance en cours");

  /* Ouverture d'un profil depuis la communauté */
  useEffect(() => {
    const open = (event) => setProfileView(event.detail);
    window.addEventListener("ed-open-profile", open);
    return () => window.removeEventListener("ed-open-profile", open);
  }, []);

  /* Images introuvables : masquées proprement */
  useEffect(() => {
    const hide = (event) => { if (event.target?.tagName === "IMG") event.target.classList.add("img-broken"); };
    document.addEventListener("error", hide, true);
    return () => document.removeEventListener("error", hide, true);
  }, []);

  /* Prix des formations et des services modifiables depuis l'administration */
  const [, setPriceTick] = useState(0);
  useEffect(() => {
    async function loadPrices() {
      const { data, error } = await supabase.from("catalog_prices").select("*");
      if (error || !data) return;
      const map = Object.fromEntries(data.map((r) => [r.item_key, r]));
      COURSES.forEach((c) => { const o = map[c.id]; if (o) { if (o.price_xaf != null) c.price = o.price_xaf; c.oldPrice = o.old_price_xaf ?? null; } });
      SERVICES.forEach((s) => { s.price = map[s.id]?.price_text || ""; });
      setPriceTick((t) => t + 1);
    }
    loadPrices();
    window.addEventListener("ed-prices-updated", loadPrices);
    return () => window.removeEventListener("ed-prices-updated", loadPrices);
  }, []);

  /* Notifications */
  function notify(message) {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 4000);
  }

  useEffect(() => {
    const handleAppNotification = (event) => notify(event.detail || "Action effectuée.");
    window.addEventListener("ed-bcenter-notify", handleAppNotification);
    return () => window.removeEventListener("ed-bcenter-notify", handleAppNotification);
  }, []);

  useEffect(() => {
    let active = true;
    async function checkPlatformStatus() {
      const { data, error } = await supabase.rpc("get_platform_public_status");
      if (error || !active || !data) return;
      setPlatformClosed(Boolean(data.maintenance_mode));
      if (data.maintenance_message) setPlatformClosureMessage(data.maintenance_message);
    }
    checkPlatformStatus();
    const timer = window.setInterval(checkPlatformStatus, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  /* Chargement du profil utilisateur */
  async function loadUserData(currentUser) {
    if (!currentUser) {
      setProfile(null);
      setRole("client");
      return;
    }

    let currentProfile = {
      id: currentUser.id,
      full_name: currentUser.user_metadata?.full_name || "",
      phone: currentUser.user_metadata?.phone || "",
      sex: currentUser.user_metadata?.sex || "",
      avatar_url: currentUser.user_metadata?.avatar_url || "",
      points: 0,
    };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        if (!isMissingTableError(error)) {
          console.error("Erreur de chargement du profil :", error.message);
        }
      } else if (data) {
        currentProfile = {
          ...currentProfile,
          ...data,
        };
      }
    } catch (error) {
      console.error("Chargement du profil :", error.message);
    }

    setProfile(currentProfile);

    /* Récupération du rôle */
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!error && data?.role) {
        setRole(data.role);
      } else {
        setRole("client");
      }
    } catch {
      setRole("client");
    }
  }

  /* Compteur de notifications en temps réel pour le compte connecté */
  useEffect(() => {
    if (!user?.id) {
      setUnreadNotifications(0);
      return undefined;
    }

    let active = true;
    async function refreshUnread() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (!error && active) setUnreadNotifications(count || 0);
    }
    refreshUnread();
    const channel = supabase
      .channel(`notification-count-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => { if (payload.eventType === "INSERT") playPing(); refreshUnread(); })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  /* Initialisation de l'application */
  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        const currentUser = data.session?.user || null;
        const { data: platformStatus } = await supabase.rpc("get_platform_public_status");
        if (platformStatus) {
          setPlatformClosed(Boolean(platformStatus.maintenance_mode));
          if (platformStatus.maintenance_message) setPlatformClosureMessage(platformStatus.maintenance_message);
        }

        setUser(currentUser);

        if (currentUser) {
          await loadUserData(currentUser);
        }
      } catch (error) {
        console.error(
          "Erreur d'initialisation :",
          error.message
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "PASSWORD_RECOVERY") setRecovery(true);
      const currentUser = session?.user || null;

      setUser(currentUser);

      if (currentUser) {
        window.setTimeout(() => {
          if (mounted) {
            loadUserData(currentUser);
          }
        }, 0);
      } else {
        setProfile(null);
        setRole("client");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* Navigation */
  function navigateTo(page) {
    setActivePage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* Ouverture de la connexion */
  function openLogin() {
    setAuthModal("login");
  }

  /* Ouverture de l'inscription */
  function openRegister(course = null) {
    if (course) {
      setEnrollCourse(course);
      return;
    }
    setSelectedCourse(course);
    setAuthModal("register");
  }

  /* Connexion réussie */
  async function handleLoginSuccess(loggedInUser) {
    setUser(loggedInUser);

    await loadUserData(loggedInUser);

    setAuthModal(null);

    notify("Connexion réussie. Bienvenue chez ED B-CENTER !");
  }

  /* Inscription réussie */
  async function handleRegisterSuccess(newUser, newProfile) {
    setUser(newUser);

    try {
      const profileData = {
        id: newUser.id,
        full_name: newProfile.full_name,
        phone: newProfile.phone,
        sex: newProfile.sex,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, {
          onConflict: "id",
        });

      if (error && !isMissingTableError(error)) {
        console.error(
          "Enregistrement du profil :",
          error.message
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de la création du profil :",
        error.message
      );
    }

    await loadUserData(newUser);

    notify("Ton compte a été créé.");
  }

  /* Déconnexion */
  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setProfile(null);
      setRole("client");
      setAuthModal(null);
      setEditProfileOpen(false);

      navigateTo("home");

      notify("Tu es maintenant déconnecté.");
    } catch (error) {
      notify(
        error.message || "La déconnexion a échoué."
      );
    }
  }

  /* Enregistrement des modifications du profil */
  async function handleSaveProfile({
    full_name,
    phone,
    photoFile,
  }) {
    if (!user) {
      throw new Error("Tu dois être connecté.");
    }

    let avatarUrl =
      profile?.avatar_url ||
      profile?.profile_photo ||
      user.user_metadata?.avatar_url ||
      "";

    /*
      Le téléversement de la photo nécessite un bucket
      Storage configuré dans Supabase.
    */
    if (photoFile) {
      const extension =
        photoFile.name.split(".").pop() || "jpg";

      const filePath =
        `user-avatars/${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("ed-b-center-images")
        .upload(filePath, photoFile, {
          upsert: true,
          contentType: photoFile.type,
        });

      if (uploadError) {
        throw new Error(
          "Impossible d'envoyer la photo. Vérifie les règles de stockage du bucket ed-b-center-images dans Supabase."
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("ed-b-center-images")
        .getPublicUrl(filePath);

      avatarUrl = publicUrlData.publicUrl;
    }

    const updatedProfile = {
      id: user.id,
      full_name,
      phone,
      avatar_url: avatarUrl,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(updatedProfile, {
        onConflict: "id",
      });

    if (profileError) {
      throw new Error(
        "Impossible d'enregistrer les informations du profil : " +
          profileError.message
      );
    }

    const { error: metadataError } =
      await supabase.auth.updateUser({
        data: {
          full_name,
          phone,
          avatar_url: avatarUrl,
        },
      });

    if (metadataError) {
      console.error(
        "Mise à jour des informations du compte :",
        metadataError.message
      );
    }

    await loadUserData({
      ...user,
      user_metadata: {
        ...user.user_metadata,
        full_name,
        phone,
        avatar_url: avatarUrl,
      },
    });

    notify("Ton profil a été mis à jour.");
  }

  /* Sélection d'un service */
  function handleSelectService(service) {
    setSelectedService(service);
    navigateTo("contact");
  }

  /* Affichage du chargement */
  if (loading) {
    return (
      <div className="app-loading">
        <img
          src={image("logo-ed-b-center.png")}
          alt="Logo ED BUSINESS CENTER"
        />

        <p>Chargement de ED BUSINESS CENTER...</p>
      </div>
    );
  }

  /* Fermeture globale pilotée par le coordinateur via Supabase. */
  if (platformClosed) {
    return (
      <div className="app platform-maintenance-page">
        <div className="platform-maintenance-card">
          <img src={image("logo-ed-b-center.png")} alt="Logo ED BUSINESS CENTER" />
          <span className="eyebrow">INFORMATION IMPORTANTE</span>
          <h1>{platformClosureMessage || "APPLICATION FERMÉE"}</h1>
          <p>La plateforme est temporairement indisponible. Merci de revenir plus tard.</p>
          {user ? (
            <CoordinatorPanel onNotify={notify} onStatusChange={(closed, message) => { setPlatformClosed(closed); if (message) setPlatformClosureMessage(message); }} />
          ) : (
            <>
              <button type="button" className="button button-primary" onClick={openLogin}>Connexion coordinateur</button>
              {authModal === "login" && <LoginModal onClose={() => setAuthModal(null)} onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setAuthModal("register")} />}
            </>
          )}
        </div>
      </div>
    );
  }

  /* Protection : connexion obligatoire */
if (!user) {
  return (
    <div className="app auth-required">
      <div className="auth-required-content">
        <img
          src={image("logo-ed-b-center.png")}
          alt="Logo ED BUSINESS CENTER"
        />

        <h1>Bienvenue chez ED BUSINESS CENTER</h1>

        <p>
          Crée ton compte ou connecte-toi pour accéder
          à notre plateforme.
        </p>

        <button
          type="button"
          className="button button-primary"
          onClick={openLogin}
        >
          Se connecter
        </button>

        <button
          type="button"
          className="button button-outline"
          onClick={() => openRegister()}
        >
          Créer un compte
        </button>
      </div>

      {authModal === "login" && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setAuthModal("register")}
        />
      )}

      {authModal === "register" && (
        <RegisterModal
          onClose={() => setAuthModal(null)}
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setAuthModal("login")}
          selectedCourse={selectedCourse}
        />
      )}
    </div>
  );
}

/* Interface principale */
return (
  <div className="app">
      <Header
        user={user}
        profile={profile}
        unreadNotifications={unreadNotifications}
        onLogin={openLogin}
        onRegister={() => openRegister()}
        onLogout={handleLogout}
        onNavigate={navigateTo}
        activePage={activePage}
        role={role}
      />

      <main>
        {activePage === "home" && (
          <>
            <SearchBox />

            <MotivationCarousel />

            <HomeGate section="announcement"><HomeAnnouncement /></HomeGate>

            <HomeGate section="videos"><LearnerVideos /></HomeGate>

            <HomeGate section="top_learner"><TopLearner /></HomeGate>

            <HomeGate section="intro">
              <IntroSection
                onNavigate={navigateTo}
                onRegister={() => openRegister()}
              />
            </HomeGate>

            <HomeGate section="services">
              <ServicesSection
                onNavigate={navigateTo}
                onSelectService={handleSelectService}
              />
            </HomeGate>

            <HomeGate section="catalogs"><CatalogsHome /></HomeGate>

            <HomeGate section="jobs"><JobsHome /></HomeGate>

            <HomeGate section="courses" defaultVisible={false}>
              <CoursesSection
                onRegister={openRegister}
                onNavigate={navigateTo}
              />
            </HomeGate>

            <ContactSection />
          </>
        )}

        {activePage === "news" && <NewsSection user={user} role={role} onNotify={notify} />}

        {activePage === "jobs" && <JobsPage />}

        {activePage === "photo" && <CatalogPhoto />}

        {activePage === "referral" && <ReferralPanel />}

        {activePage === "tableaux" && <CatalogPage catalog="tableaux" />}

        {activePage === "chine" && <CatalogPage catalog="chine" />}

        {activePage === "design" && <CatalogPage catalog="design" />}

        {activePage === "images" && (role === "admin" ? <ImageLibrarySection onNotify={notify} /> : <section className="section-container"><h1>Accès réservé</h1><p>La médiathèque est réservée aux administrateurs.</p></section>)}

        {activePage === "notifications" && user && (
          <NotificationsSection user={user} onNotify={notify} />
        )}

        {activePage === "messages" && user && (
          <Messenger user={user} role={role} onNotify={notify} initialUser={chatWith} />
        )}

        {activePage === "community" && (
          <CommunitySection
            user={user}
            profile={profile}
            onNotify={notify}
            onPointsUpdated={(nextPoints) => setProfile((previous) => previous ? { ...previous, points: nextPoints } : previous)}
          />
        )}

        {activePage === "atelier" && (
          <AtelierSection user={user} profile={profile} role={role} onNotify={notify} />
        )}

        {activePage === "services" && (
          <>
            <ServicesSection
              onNavigate={navigateTo}
              onSelectService={handleSelectService}
            />
            {(role === "admin" || role === "trainer") && <ServiceManager onNotify={notify} />}
          </>
        )}

        {activePage === "courses" && (
          <CoursesSection
            onRegister={openRegister}
            onNavigate={navigateTo}
          />
        )}

        {activePage === "contact" && (
          <>
            {selectedService && (
              <div className="selected-service-notice section-container">
                <h2>{selectedService.name}</h2>

                <p>{selectedService.description}</p>

                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setSelectedService(null)}
                >
                  Fermer
                </button>
              </div>
            )}

            <ContactSection />
          </>
        )}

        {activePage === "account" && (
          user ? (
            <AccountSection
              user={user}
              profile={profile}
              role={role}
              onNavigate={navigateTo}
              onLogout={handleLogout}
              onEditProfile={() => setEditProfileOpen(true)}
              onPlatformStatusChange={(closed, message) => { setPlatformClosed(closed); if (message) setPlatformClosureMessage(message); }}
            />
          ) : (
            <section className="account-access-denied section-container">
              <h2>Connecte-toi à ton espace</h2>

              <p>
                Tu dois être connecté pour accéder à ton espace personnel.
              </p>

              <button
                type="button"
                className="button button-primary"
                onClick={openLogin}
              >
                Se connecter
              </button>

              <button
                type="button"
                className="button button-outline"
                onClick={() => openRegister()}
              >
                Créer un compte
              </button>
            </section>
          )
        )}
      </main>

      <PendingReferral />
      <BottomNav activePage={activePage} />

      {/* Pied de page */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img
              src={image("logo-ed-b-center.png")}
              alt="Logo ED BUSINESS CENTER"
            />

            <h3>{BRAND.name}</h3>

            <p>{BRAND.slogan}</p>
          </div>

          <div className="footer-links">
            <button
              type="button"
              onClick={() => navigateTo("home")}
            >
              Accueil
            </button>

            <button
              type="button"
              onClick={() => navigateTo("services")}
            >
              Services
            </button>

            <button
              type="button"
              onClick={() => navigateTo("courses")}
            >
              Formations
            </button>
            <button type="button" onClick={() => navigateTo("news")}>Actualités</button>
            <button type="button" onClick={() => navigateTo("community")}>Communauté</button>
            <button type="button" onClick={() => navigateTo("atelier")}>Ateliers</button>

            <button
              type="button"
              onClick={() => navigateTo("contact")}
            >
              Contact
            </button>
          </div>

          <div className="footer-socials">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={social.description}
                title={social.name}
              >
                <span className={`social-fallback-mark social-${social.name.toLowerCase()}`} aria-hidden="true">
                  {social.name === "WhatsApp" ? "WA" : social.name === "Facebook" ? "f" : social.name === "Instagram" ? "◎" : "@"}
                </span>
              </a>
            ))}
          </div>

          <p className="footer-copyright">
            © {new Date().getFullYear()} ED BUSINESS CENTER.
            Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* Fenêtre de connexion */}
      {authModal === "login" && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setAuthModal("register")}
        />
      )}

      {enrollCourse && (
        <CourseEnrollModal course={enrollCourse} user={user} profile={profile} whatsapp={BRAND.whatsapp} onClose={() => setEnrollCourse(null)} onNotify={notify} />
      )}
      {profileView && user && <ProfileCardModal userId={profileView} me={user} onClose={() => setProfileView(null)} onNotify={notify} onMessage={(id) => { setProfileView(null); setChatWith(id); navigateTo("messages"); }} />}
      {recovery && <PasswordRecoveryModal onClose={() => setRecovery(false)} onNotify={notify} />}

      {/* Fenêtre d'inscription */}
      {authModal === "register" && (
        <RegisterModal
          onClose={() => {
            setAuthModal(null);
            setSelectedCourse(null);
          }}
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setAuthModal("login")}
          selectedCourse={selectedCourse}
        />
      )}

      {/* Modification du profil */}
      {editProfileOpen && user && (
        <EditProfileModal
          user={user}
          profile={profile}
          onClose={() => setEditProfileOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className="app-notification" role="status">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;
