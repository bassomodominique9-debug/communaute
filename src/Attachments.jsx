import { useRef, useState } from "react";
import { supabase } from "./supabaseClient";

export const FILES_BUCKET = "ed-b-center-files";
const IMAGE = /^image\/(png|jpe?g|webp|gif)$/;
const DOC = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i;
export const safeUrl = (url) => (/^https?:\/\//i.test(url || "") ? url : "#");

export async function uploadFile(user, file, folder = "") {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/${folder}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(FILES_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from(FILES_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function AttachmentList({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="attachment-list">
      {items.map((a, i) => a.type === "image"
        ? <a key={i} href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer"><img className="attachment-image" src={safeUrl(a.url)} alt={a.name || "Photo jointe"} loading="lazy" /></a>
        : <a key={i} className="attachment-chip" href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer">{a.type === "link" ? "Lien" : "Fichier"} : {a.name || a.url}</a>)}
    </div>
  );
}

export function AttachmentPicker({ user, value, onChange, full = false, max = 4, onNotify }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const add = (item) => onChange([...value, item]);

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (value.length >= max) { onNotify?.(`${max} pièces jointes au maximum.`); return; }
    const isImage = IMAGE.test(file.type);
    if (!isImage && !(full && DOC.test(file.name))) { onNotify?.(full ? "Formats acceptés : photo, PDF, Word, Excel, PowerPoint, texte." : "Seules les photos sont acceptées."); return; }
    if (file.size > (isImage ? 5 : 10) * 1024 * 1024) { onNotify?.(isImage ? "Photo trop lourde (5 Mo maximum)." : "Fichier trop lourd (10 Mo maximum)."); return; }
    setBusy(true);
    try { add({ type: isImage ? "image" : "file", url: await uploadFile(user, file), name: file.name }); }
    catch (error) { onNotify?.(/bucket|not found|policy/i.test(error.message) ? "Installe le SQL « partie 12 » dans Supabase." : error.message); }
    setBusy(false);
  }
  function addLink() {
    const url = link.trim();
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) { onNotify?.("Entre un lien complet (https://…)."); return; }
    if (value.length >= max) { onNotify?.(`${max} pièces jointes au maximum.`); return; }
    add({ type: "link", url, name: url.replace(/^https?:\/\//i, "").slice(0, 60) }); setLink("");
  }
  return (
    <div className="attachment-picker">
      <input ref={ref} type="file" hidden accept={full ? "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" : "image/*"} onChange={pick} />
      <button type="button" className="button button-outline" disabled={busy} onClick={() => ref.current?.click()}>{busy ? "Envoi…" : full ? "Ajouter photo ou fichier" : "Ajouter une photo"}</button>
      {full && <div className="attachment-link"><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Coller un lien (https://…)" /><button type="button" className="button button-outline" onClick={addLink}>Ajouter</button></div>}
      {value.length > 0 && <div className="attachment-list">{value.map((a, i) => <span key={i} className="attachment-chip">{a.type === "image" ? "Photo" : a.type === "link" ? "Lien" : "Fichier"} : {a.name}<button type="button" aria-label="Retirer" onClick={() => onChange(value.filter((_, k) => k !== i))}>×</button></span>)}</div>}
    </div>
  );
}
