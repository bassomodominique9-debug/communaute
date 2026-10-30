import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import { imageUrl } from "./imageCatalog";

const EMPTY = { image_name: "mon livre.jpeg", title: "", description: "", event_day: "", event_date: "", price: "", is_published: true };

export default function AnnouncementEditor({ user, onNotify }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  useEffect(() => {
    supabase.from("home_announcement").select("*").eq("singleton", true).maybeSingle().then(({ data, error }) => {
      if (error) onNotify?.("Installe le SQL « partie 10 » dans Supabase.");
      else if (data) setForm({ ...EMPTY, ...data, event_date: data.event_date || "" });
    });
  }, []);

  async function pickImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { onNotify?.("Choisis une image (JPG, PNG ou WebP)."); return; }
    setBusy(true);
    try { const url = await uploadFile(user, file, "announcements"); setForm((prev) => ({ ...prev, image_name: url })); onNotify?.("Photo téléversée. Clique sur Enregistrer pour la publier."); }
    catch (error) { onNotify?.(error.message || "Échec du téléversement."); }
    setBusy(false);
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("home_announcement").upsert({
      singleton: true,
      image_name: form.image_name.trim() || "mon livre.jpeg",
      title: form.title.trim(),
      description: form.description.trim(),
      event_day: form.event_day.trim(),
      event_date: form.event_date || null,
      price: form.price.trim(),
      price_xaf: form.price_xaf === "" || form.price_xaf == null ? null : Number(form.price_xaf),
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }, { onConflict: "singleton" });
    setBusy(false);
    onNotify?.(error ? error.message : "Annonce de l'accueil mise à jour.");
  }

  return (
    <form className="account-content-card" onSubmit={save}>
      <h3>Annonce de la page d'accueil</h3>
      <label>Photo de l'annonce (choisis une image dans ta galerie)<input type="file" accept="image/*" onChange={pickImage} disabled={busy} /></label>
      {form.image_name && <img className="announcement-preview" src={/^https?:\/\//i.test(form.image_name) ? form.image_name : imageUrl(form.image_name)} alt="Aperçu de la photo" />}
      <label>Titre<input value={form.title} onChange={set("title")} maxLength={120} /></label>
      <label>Texte court<textarea rows={3} value={form.description} onChange={set("description")} maxLength={300} /></label>
      <label>Jour<input value={form.event_day} onChange={set("event_day")} placeholder="Samedi" maxLength={30} /></label>
      <label>Date<input type="date" value={form.event_date} onChange={set("event_date")} /></label>
      <label>Prix affiché<input value={form.price} onChange={set("price")} placeholder="5 000 FCFA" maxLength={40} /></label>
      <label>Prix en FCFA pour l'inscription (chiffres seulement)<input type="number" min="0" value={form.price_xaf ?? ""} onChange={(e) => setForm((p) => ({ ...p, price_xaf: e.target.value }))} /></label>
      <label className="admin-check"><input type="checkbox" checked={form.is_published} onChange={set("is_published")} /> Afficher l'annonce sur l'accueil</label>
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}
