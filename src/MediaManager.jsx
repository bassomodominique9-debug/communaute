import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import { notifyMediaUpdated } from "./mediaSlots";
import "./catalogs.css";

const errMsg = (e) => (/function|schema cache|does not exist|relation/i.test(e?.message || "") ? "Installe le SQL « partie 32 » dans Supabase." : e?.message || "Erreur");

// Médiathèque : téléverser une fois, affecter à n'importe quel emplacement du site
export default function MediaManager({ user, onNotify }) {
  const [slots, setSlots] = useState([]);
  const [library, setLibrary] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const s = await supabase.from("media_slots").select("*").order("position");
    if (s.error) onNotify?.(errMsg(s.error)); else setSlots(s.data || []);
    const l = await supabase.from("media_library").select("*").order("created_at", { ascending: false });
    if (!l.error) setLibrary(l.data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function uploadToLibrary(files) {
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) throw new Error("Seules les images sont acceptées (JPG, PNG, WebP).");
        if (file.size > 8 * 1024 * 1024) throw new Error(`« ${file.name} » dépasse 8 Mo.`);
        const url = await uploadFile(user, file, "mediatheque/");
        const { error } = await supabase.from("media_library").insert({ url, name: file.name });
        if (error) throw error;
      }
      onNotify?.("Image(s) ajoutée(s) à la médiathèque.");
      load();
    } catch (err) { onNotify?.(errMsg(err)); }
    setBusy(false);
  }

  async function setSlot(key, url) {
    const { error } = await supabase.from("media_slots").update({ url, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) { onNotify?.(errMsg(error)); return; }
    onNotify?.(url ? "Image affectée. Le site est mis à jour." : "Image retirée : l'image par défaut est affichée.");
    notifyMediaUpdated();
    load();
  }

  async function deleteLibraryItem(item) {
    if (!window.confirm("Supprimer cette image de la médiathèque ? Les emplacements qui l'utilisent reviendront à l'image par défaut.")) return;
    await supabase.from("media_slots").update({ url: null }).eq("url", item.url);
    const { error } = await supabase.from("media_library").delete().eq("id", item.id);
    if (error) { onNotify?.(errMsg(error)); return; }
    notifyMediaUpdated();
    load();
  }

  return (
    <>
      <div className="account-content-card admin-form">
        <h3>1. Téléverser des images</h3>
        <p>Ajoute les photos une fois ici. Tu les affectes ensuite aux emplacements ci-dessous, et tu peux les changer à tout moment.</p>
        <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => uploadToLibrary(Array.from(e.target.files || []))} />
        {busy && <small>Téléversement en cours…</small>}
      </div>

      <div className="account-content-card">
        <h3>2. Emplacements du site</h3>
        {slots.map((s) => (
          <SlotRow key={s.key} slot={s} library={library} user={user} onSet={setSlot} onNotify={onNotify} />
        ))}
      </div>

      <div className="account-content-card">
        <h3>3. Photos des catalogues (3 à 5 par article)</h3>
        <CatalogGalleries user={user} library={library} onNotify={onNotify} onLibraryChanged={load} />
      </div>

      <div className="account-content-card">
        <h3>Médiathèque ({library.length})</h3>
        <div className="media-grid">
          {library.map((item) => (
            <div key={item.id} className="media-thumb">
              <img src={item.url} alt={item.name} loading="lazy" />
              <button type="button" className="button button-danger" onClick={() => deleteLibraryItem(item)}>Supprimer</button>
            </div>
          ))}
          {library.length === 0 && <p>Aucune image pour le moment.</p>}
        </div>
      </div>
    </>
  );
}

function SlotRow({ slot, library, user, onSet, onNotify }) {
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { onNotify?.("Choisis une image."); return; }
    setBusy(true);
    try {
      const url = await uploadFile(user, file, "mediatheque/");
      await supabase.from("media_library").insert({ url, name: file.name });
      await onSet(slot.key, url);
    } catch (err) { onNotify?.(errMsg(err)); }
    setBusy(false);
  }

  return (
    <div className="admin-row slot-row">
      <div className="slot-preview">
        {slot.url ? <img src={slot.url} alt={slot.label} /> : <span>Par défaut</span>}
      </div>
      <div className="slot-controls">
        <strong>{slot.label}</strong>
        <select value={choice} onChange={(e) => { setChoice(e.target.value); if (e.target.value) onSet(slot.key, e.target.value); }}>
          <option value="">Choisir dans la médiathèque…</option>
          {library.map((item) => <option key={item.id} value={item.url}>{item.name || item.url.slice(-30)}</option>)}
        </select>
        <label className="slot-upload">Ou téléverser pour cet emplacement
          <input type="file" accept="image/*" disabled={busy} onChange={upload} />
        </label>
        {slot.url && <button type="button" className="button button-outline" onClick={() => onSet(slot.key, null)}>Retirer l'image</button>}
      </div>
    </div>
  );
}

// Galeries des articles de catalogue : choisir, ajouter, retirer les photos à tout moment
function CatalogGalleries({ user, library, onNotify, onLibraryChanged }) {
  const [items, setItems] = useState([]);
  const [galleries, setGalleries] = useState({});
  const [busy, setBusy] = useState(false);
  const MAX = 5;

  const load = useCallback(async () => {
    const i = await supabase.from("catalog_items").select("id, title, catalog").order("catalog").order("position");
    if (i.error) { onNotify?.(errMsg(i.error)); return; }
    setItems(i.data || []);
    const g = await supabase.from("catalog_gallery").select("id, item_id, url, position").order("position");
    const map = {};
    (g.data || []).forEach((row) => { (map[row.item_id] = map[row.item_id] || []).push(row); });
    setGalleries(map);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addUrl(item, url) {
    const current = galleries[item.id] || [];
    if (current.length >= MAX) { onNotify?.(`Une galerie ne peut pas dépasser ${MAX} photos.`); return false; }
    const { error } = await supabase.from("catalog_gallery").insert({ item_id: item.id, url, position: current.length + 1 });
    if (error) { onNotify?.(errMsg(error)); return false; }
    return true;
  }

  async function pickFromLibrary(item, url) {
    if (await addUrl(item, url)) { onNotify?.("Photo ajoutée à la galerie."); load(); }
  }

  async function uploadFor(item, files) {
    if (!files.length) return;
    const room = MAX - (galleries[item.id] || []).length;
    if (files.length > room) { onNotify?.(`Tu peux ajouter ${room} photo(s) de plus à cette galerie.`); return; }
    setBusy(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) throw new Error("Seules les images sont acceptées.");
        const url = await uploadFile(user, file, "catalogue/");
        await supabase.from("media_library").insert({ url, name: file.name });
        if (!(await addUrl(item, url))) break;
      }
      onNotify?.("Photos ajoutées à la galerie.");
      onLibraryChanged?.();
      load();
    } catch (err) { onNotify?.(errMsg(err)); }
    setBusy(false);
  }

  async function removePhoto(row) {
    const { error } = await supabase.from("catalog_gallery").delete().eq("id", row.id);
    if (error) { onNotify?.(errMsg(error)); return; }
    onNotify?.("Photo retirée de la galerie."); load();
  }

  if (items.length === 0) return <p>Aucun article. Crée-les dans « Catalogues & devis ».</p>;

  return (
    <>
      {items.map((item) => {
        const photos = galleries[item.id] || [];
        return (
          <div key={item.id} className="gallery-item">
            <div className="gallery-item-head">
              <strong>{item.title}</strong>
              <small>{photos.length} / {MAX} photo(s)</small>
            </div>
            <div className="media-grid">
              {photos.map((row) => (
                <div key={row.id} className="media-thumb">
                  <img src={row.url} alt="" loading="lazy" />
                  <button type="button" className="button button-danger" onClick={() => removePhoto(row)}>Retirer</button>
                </div>
              ))}
            </div>
            {photos.length < MAX && (
              <div className="gallery-controls">
                <select value="" onChange={(e) => e.target.value && pickFromLibrary(item, e.target.value)} aria-label="Choisir dans la médiathèque">
                  <option value="">Ajouter depuis la médiathèque…</option>
                  {library.map((l) => <option key={l.id} value={l.url}>{l.name || l.url.slice(-30)}</option>)}
                </select>
                <label className="slot-upload">Ou téléverser
                  <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => uploadFor(item, Array.from(e.target.files || []))} />
                </label>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
