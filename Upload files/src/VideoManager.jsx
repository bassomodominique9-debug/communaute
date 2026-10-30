import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import { VideoPlayer } from "./LearnerVideos";

export default function VideoManager({ user, onNotify }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    const { data, error } = await supabase.from("learner_videos").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) onNotify?.("Installe le SQL « partie 12 » dans Supabase."); else setItems(data || []);
  }
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file && !/^https?:\/\//i.test(link.trim())) { onNotify?.("Choisis une vidéo ou colle un lien YouTube."); return; }
    if (file && (!/^video\/(mp4|webm)$/.test(file.type) || file.size > 50 * 1024 * 1024)) { onNotify?.("Vidéo MP4 ou WebM de 50 Mo maximum."); return; }
    setBusy(true);
    try {
      const url = file ? await uploadFile(user, file, "videos/") : link.trim();
      const { error } = await supabase.from("learner_videos").insert({ title: title.trim(), description: description.trim(), video_url: url, created_by: user.id });
      if (error) throw error;
      setTitle(""); setDescription(""); setLink(""); if (fileRef.current) fileRef.current.value = "";
      onNotify?.("Vidéo publiée sur l'accueil."); load();
    } catch (error) { onNotify?.(error.message); }
    setBusy(false);
  }
  async function remove(item) {
    if (!window.confirm("Supprimer cette vidéo ?")) return;
    const { error } = await supabase.from("learner_videos").delete().eq("id", item.id);
    if (error) onNotify?.(error.message); else load();
  }

  return (
    <div className="account-content-card">
      <h3>Vidéos des apprenants (accueil)</h3>
      <form onSubmit={save} className="admin-form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex. Le parcours d'Awa)" required maxLength={120} />
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Texte court (facultatif)" maxLength={200} />
        <label>Fichier vidéo (MP4, 50 Mo max)<input ref={fileRef} type="file" accept="video/mp4,video/webm" /></label>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="… ou lien YouTube (https://…)" />
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Envoi…" : "Publier la vidéo"}</button>
      </form>
      {items.map((v) => (
        <div className="admin-row" key={v.id}>
          <div><strong>{v.title}</strong><VideoPlayer url={v.video_url} title={v.title} /></div>
          <button type="button" className="button button-danger" onClick={() => remove(v)}>Supprimer</button>
        </div>
      ))}
    </div>
  );
}
