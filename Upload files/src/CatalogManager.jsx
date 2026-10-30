import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const EMPTY = { id: "", title: "", category: "", duration: "", description: "", skills: "", image_name: "", price_xaf: "", old_price_xaf: "", is_published: true };

export default function CatalogManager({ onNotify }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState(EMPTY);

  async function load() {
    const { data, error } = await supabase.from("catalog_courses").select("*").order("title");
    if (error) onNotify?.(error.message); else setRows(data || []);
  }
  useEffect(() => { load(); }, []);

  function pick(r) {
    setF({ ...r, skills: (r.skills || []).join(", "), price_xaf: r.price_xaf ?? "", old_price_xaf: r.old_price_xaf ?? "" });
  }

  async function save(event) {
    event.preventDefault();
    const id = f.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!id || f.title.trim().length < 3) { onNotify?.("Indique un identifiant et un titre."); return; }
    const { error } = await supabase.from("catalog_courses").upsert({
      id, title: f.title.trim(), category: f.category.trim(), duration: f.duration.trim(), description: f.description.trim(),
      skills: f.skills.split(",").map((s) => s.trim()).filter(Boolean), image_name: f.image_name.trim(),
      price_xaf: f.price_xaf === "" ? null : Number(f.price_xaf), old_price_xaf: f.old_price_xaf === "" ? null : Number(f.old_price_xaf),
      is_published: f.is_published, updated_at: new Date().toISOString(),
    });
    if (error) { onNotify?.(error.message); return; }
    onNotify?.("Formation enregistrée."); setF(EMPTY); load();
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <>
      <div className="account-content-card">
        <h3>Formations modifiées ou ajoutées</h3>
        <p>Pour modifier une formation existante, saisis son identifiant d'origine (ex. infographie-ia). Les formations non listées restent celles du site.</p>
        {rows.map((r) => (
          <button key={r.id} type="button" className="pq-row" onClick={() => pick(r)}><strong>{r.title}</strong><small>{r.id} · {r.is_published ? "affichée" : "masquée"}</small></button>
        ))}
      </div>
      <form className="account-content-card admin-form" onSubmit={save}>
        <h3>Formation</h3>
        <input value={f.id} onChange={set("id")} placeholder="Identifiant (ex. infographie-ia)" required />
        <input value={f.title} onChange={set("title")} placeholder="Titre" required maxLength={160} />
        <input value={f.category} onChange={set("category")} placeholder="Catégorie" maxLength={80} />
        <input value={f.duration} onChange={set("duration")} placeholder="Durée (ex. 2 mois)" maxLength={40} />
        <textarea rows={3} value={f.description} onChange={set("description")} placeholder="Description" maxLength={1000} />
        <input value={f.skills} onChange={set("skills")} placeholder="Compétences, séparées par des virgules" />
        <input value={f.image_name} onChange={set("image_name")} placeholder="Nom de l'image dans la médiathèque" />
        <input type="number" min="0" value={f.price_xaf} onChange={set("price_xaf")} placeholder="Prix (FCFA)" />
        <input type="number" min="0" value={f.old_price_xaf} onChange={set("old_price_xaf")} placeholder="Ancien prix (pour une offre)" />
        <label className="admin-check"><input type="checkbox" checked={f.is_published} onChange={set("is_published")} /> Afficher sur le site</label>
        <button type="submit" className="button button-primary">Enregistrer</button>
      </form>
    </>
  );
}
