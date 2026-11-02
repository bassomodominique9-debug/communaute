import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import "./flyers-lot5.css";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 39 » dans Supabase." : e?.message || "Erreur");

// Flyers d'emploi de l'administrateur : image + contact, sans formulaire pour le candidat
export default function JobFlyers() {
  const [state, setState] = useState({ loading: true, isAdmin: false, flyers: [] });
  const [file, setFile] = useState(null);
  const [contact, setContact] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase.rpc("list_job_flyers");
    if (error) { setState({ loading: false, isAdmin: false, flyers: [] }); return; }
    setState({ loading: false, isAdmin: !!data?.is_admin, flyers: Array.isArray(data?.flyers) ? data.flyers : [] });
  }
  useEffect(() => { load(); }, []);

  async function publish(event) {
    event.preventDefault();
    if (!file) { notify("Ajoute l'image du flyer."); return; }
    if (!file.type.startsWith("image/")) { notify("Le flyer doit être une image."); return; }
    if (contact.trim().length < 5) { notify("Indique un numéro ou une adresse de contact."); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = await uploadFile(user, file, "emploi/");
      const { error } = await supabase.rpc("admin_publish_flyer", { p_image: url, p_contact: contact, p_title: title });
      if (error) throw error;
      setFile(null); setContact(""); setTitle("");
      notify("Flyer publié.");
      load();
    } catch (err) { notify(errMsg(err)); }
    setBusy(false);
  }

  async function remove(id) {
    if (!window.confirm("Supprimer ce flyer d'emploi ?")) return;
    const { error } = await supabase.rpc("admin_delete_flyer", { p_id: id });
    if (error) { notify(errMsg(error)); return; }
    notify("Flyer supprimé.");
    load();
  }

  return (
    <section className="flyers-section" aria-label="Offres publiées par l'administrateur">
      <span className="eyebrow">OFFRES DE L'ADMINISTRATION</span>
      <div className="flyers-nb">NB : aucune entreprise ne vous demandera de l'argent pour un travail. Soyez vigilants et signalez-nous tout doute.</div>

      {state.isAdmin && (
        <form className="flyers-form" onSubmit={publish}>
          <strong>Publier un flyer d'emploi</strong>
          <label>Image du flyer<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required /></label>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact : numéro ou adresse" required maxLength={200} />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (facultatif)" maxLength={160} />
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Publication…" : "Publier le flyer"}</button>
        </form>
      )}

      {state.loading && <p className="flyers-empty">Chargement…</p>}
      {!state.loading && state.flyers.length === 0 && <p className="flyers-empty">Aucun flyer d'emploi pour le moment.</p>}

      <div className="flyers-row">
        {state.flyers.map((f) => (
          <article key={f.id} className="flyer-card">
            <img src={f.image_url} alt={f.title || "Flyer d'emploi"} loading="lazy" />
            <div className="flyer-meta">
              {f.title && <strong>{f.title}</strong>}
              <small>Publié par l'administrateur</small>
              <span className="flyer-contact">Contact : {f.contact}</span>
              {state.isAdmin && <button type="button" className="flyer-delete" onClick={() => remove(f.id)}>Supprimer</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
