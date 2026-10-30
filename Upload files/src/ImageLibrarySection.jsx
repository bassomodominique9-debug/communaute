import { useMemo, useState } from "react";
import { IMAGE_ASSETS, imageUrl } from "./imageCatalog";

const CATEGORY_LABELS = {
  logos: "Logos",
  bannieres: "Bannières",
  formations: "Formations",
  services: "Services",
  motivation: "Motivation",
  avatars: "Avatars",
  ateliers: "Ateliers",
  interfaces: "Interfaces",
  publications: "Publications",
  "le-reseau": "LE RÉSEAU",
  "produits-commandes": "Produits et commandes",
  administration: "Administration",
  "compte-et-systeme": "Compte et système",
  communication: "Communication",
  "formation-et-numerique": "Formation et numérique",
  "illustrations-diverses": "Autres illustrations",
  "à-identifier": "À identifier",
};

export default function ImageLibrarySection({ onNotify }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(IMAGE_ASSETS.map((item) => item.category))].sort(), []);
  const filtered = useMemo(() => IMAGE_ASSETS.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const matchesQuery = item.name.toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr"));
    return matchesCategory && matchesQuery;
  }), [category, query]);

  async function copyUrl(name) {
    const url = imageUrl(name);
    try {
      await navigator.clipboard.writeText(url);
      onNotify?.("URL de l’image copiée.");
    } catch {
      window.prompt("Copie cette URL :", url);
    }
  }

  return (
    <section className="image-library section-container">
      <div className="image-library-hero">
        <div>
          <span className="eyebrow">ADMINISTRATION · MÉDIATHÈQUE</span>
          <h1>Gestion des images</h1>
          <p>Recherche les visuels connus, vérifie leur nom exact et copie leur URL Supabase. Les fichiers eux-mêmes restent dans le bucket Storage.</p>
          <strong className="image-library-count">{filtered.length} / {IMAGE_ASSETS.length} fichiers répertoriés</strong>
        </div>
        <img src={imageUrl("illustration-bibliotheque-images.png")} alt="Bibliothèque d’images ED BUSINESS CENTER" loading="lazy" />
      </div>

      <div className="image-library-filters">
        <label>Rechercher un fichier
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. course-excel.png" type="search" />
        </label>
        <label>Catégorie
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Toutes les catégories</option>
            {categories.map((item) => <option value={item} key={item}>{CATEGORY_LABELS[item] || item}</option>)}
          </select>
        </label>
      </div>

      <div className="image-library-grid">
        {filtered.map((item) => (
          <article className="image-library-card" key={item.name}>
            <div className="image-library-preview">
              <img src={imageUrl(item.name)} alt={item.name} loading="lazy" />
            </div>
            <div className="image-library-card-copy">
              <strong>{item.name}</strong>
              <small>{CATEGORY_LABELS[item.category] || item.category}</small>
              <button className="button button-outline" type="button" onClick={() => copyUrl(item.name)}>Copier l’URL</button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <div className="community-empty"><h2>Aucun fichier correspondant</h2><p>Essaie un autre nom ou une autre catégorie.</p></div>}
      <p className="image-library-note">Cette liste contient les noms identifiés dans le PDF de disposition, pas un inventaire certifié des 153 objets du bucket. Pour ajouter, remplacer ou supprimer un fichier, utilise Supabase Storage en conservant le nom exact attendu par le code.</p>
    </section>
  );
}
