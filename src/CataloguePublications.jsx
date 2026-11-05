import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));

export default function CataloguePublications() {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    const { data } = await supabase.rpc("my_catalogue");
    if (!data || !data.id) { setItems([]); return; }
    const { data: pubs } = await supabase.rpc("list_catalogue_publications", { p_id: data.id });
    setItems(Array.isArray(pubs) ? pubs : []);
  }
  useEffect(() => { load(); }, []);
  async function publish(e) {
    e.preventDefault();
    setBusy(true);
    try {
      let photo = null;
      if (file) { const { data: { user } } = await supabase.auth.getUser(); photo = await uploadFile(user, file, "publications-catalogues/"); }
      const { error } = await supabase.rpc("my_publish_catalogue", { p_body: body, p_photo: photo });
      if (error) throw error;
      setBody(""); setFile(null); notify("Publication ajoutée."); load();
    } catch (err) { notify(err?.message || "Erreur"); }
    setBusy(false);
  }
  async function remove(id) {
    if (!window.confirm("Supprimer cette publication ?")) return;
    const { error } = await supabase.rpc("my_delete_publication", { p_id: id });
    if (error) notify(error.message); else load();
  }
  return (
    <div className="ce-pubs-owner">
      <h4 className="ce-sub">Publier dans mon catalogue</h4>
      <form className="ce-form" onSubmit={publish}>
        <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Présente une prestation ou une nouveauté" maxLength={800} />
        <label>Photo (facultative)<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        <button type="submit" className="ce-submit" disabled={busy}>{busy ? "Envoi…" : "Publier"}</button>
      </form>
      {items.map((p) => (
        <article key={p.id} className="ce-pub">
          {p.photo_url && <img src={p.photo_url} alt="" loading="lazy" />}
          {p.body && <p>{p.body}</p>}
          <button type="button" className="ce-del" onClick={() => remove(p.id)}>Supprimer</button>
        </article>
      ))}
    </div>
  );
}
