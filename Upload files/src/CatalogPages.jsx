import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadFile } from "./Attachments";
import PaymentFlow from "./PaymentFlow";
import { useSlot } from "./mediaSlots";
import { frameQuote } from "./pricing";
import "./catalogs.css";

const notify = (m) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: m }));
const go = (page) => window.dispatchEvent(new CustomEvent("ed-navigate", { detail: page }));
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 30 » dans Supabase." : e?.message || "Erreur");

export const CATALOG_TITLES = { tableaux: "Tableaux muraux", chine: "Précommandes Chine", design: "Services design et data", photo: "Photographie" };

// Liste d'un catalogue : cartes compactes avec galerie (3 à 5 photos)
export function CatalogPage({ catalog }) {
  const [items, setItems] = useState(null);
  const [quoting, setQuoting] = useState(null);
  const [china, setChina] = useState("");
  const [ordering, setOrdering] = useState(null);
  const hero = useSlot("cover_" + catalog);

  useEffect(() => {
    supabase.rpc("list_catalog", { p_catalog: catalog }).then(({ data, error }) => {
      if (error) { notify(errMsg(error)); setItems([]); return; }
      setItems(Array.isArray(data) ? data : []);
    });
    if (catalog === "chine") {
      supabase.from("service_links").select("url").eq("key", "whatsapp_china_group").maybeSingle().then(({ data }) => setChina(data?.url || ""));
    }
  }, [catalog]);

  return (
    <section className="section-container catalog-page">
      <button type="button" className="text-button" onClick={() => go("home")}>← Retour</button>
      <span className="eyebrow">CATALOGUE</span>
      <h1>{CATALOG_TITLES[catalog]}</h1>
      {hero && <img className="catalog-hero" src={hero} alt="" />}
      {catalog === "chine" && china && (
        <a className="button button-primary button-full" href={china} target="_blank" rel="noopener noreferrer">Rejoindre le groupe de précommande</a>
      )}
      {items === null && <p>Chargement…</p>}
      {items && items.length === 0 && <p>Aucun article pour le moment.</p>}
      <div className="catalog-grid">
        {(items || []).map((it) => <ItemCard key={it.id} item={it} catalog={catalog} onQuote={() => setQuoting(it)} onOrder={catalog === "tableaux" ? () => setOrdering(it) : null} />)}
      </div>
      {quoting && <QuoteModal catalog={catalog} item={quoting} onClose={() => setQuoting(null)} />}
      {ordering && <TableauOrder item={ordering} onClose={() => setOrdering(null)} />}
    </section>
  );
}

export function ItemCard({ item, onQuote, onOrder }) {
  const [idx, setIdx] = useState(0);
  const photos = item.gallery || [];
  return (
    <article className="catalog-item">
      {photos.length > 0 ? (
        <div className="catalog-gallery">
          <img src={photos[idx]} alt={item.title} loading="lazy" />
          {photos.length > 1 && (
            <div className="gallery-dots" role="tablist">
              {photos.map((_, i) => (
                <button key={i} type="button" className={i === idx ? "dot dot-on" : "dot"} aria-label={`Photo ${i + 1}`} onClick={() => setIdx(i)} />
              ))}
            </div>
          )}
        </div>
      ) : <div className="catalog-noimg" aria-hidden="true">{item.title.slice(0, 1)}</div>}
      <div className="catalog-body">
        <strong>{item.title}</strong>
        {item.description && <p>{item.description}</p>}
        <span className="catalog-price">{item.price_text || "Devis après étude"}</span>
        {onOrder && <button type="button" className="button button-primary catalog-cta" onClick={onOrder}>Commander</button>}
        <button type="button" className={onOrder ? "button button-outline catalog-cta" : "button button-primary catalog-cta"} onClick={onQuote}>Demander un devis</button>
      </div>
    </article>
  );
}

export function QuoteModal({ catalog, item, onClose }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", need: "", deadline: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function send(event) {
    event.preventDefault();
    setBusy(true);
    try {
      let fileUrl = null;
      if (file) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Connecte-toi pour joindre un fichier.");
        if (file.size > 10 * 1024 * 1024) throw new Error("Fichier trop lourd (10 Mo maximum).");
        fileUrl = await uploadFile(user, file, "devis/");
      }
      const { error } = await supabase.rpc("create_quote_request", {
        p_catalog: catalog, p_item: item?.id || null, p_name: f.name, p_phone: f.phone, p_email: f.email,
        p_need: f.need, p_deadline: f.deadline || null, p_file: fileUrl,
      });
      if (error) throw error;
      notify("Demande envoyée. L'équipe te répond rapidement.");
      onClose();
    } catch (err) { notify(errMsg(err)); }
    setBusy(false);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="auth-modal quote-modal" onSubmit={send} role="dialog" aria-modal="true" aria-label="Demande de devis">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>Demande de devis</h2>
        <p className="auth-description">{item ? item.title : CATALOG_TITLES[catalog]}</p>
        <input value={f.name} onChange={set("name")} placeholder="Nom complet" required maxLength={120} />
        <input value={f.phone} onChange={set("phone")} placeholder="Téléphone" required maxLength={30} />
        <input type="email" value={f.email} onChange={set("email")} placeholder="E-mail (facultatif)" maxLength={120} />
        <textarea rows={4} value={f.need} onChange={set("need")} placeholder="Décris ton besoin : contenu, dimensions, quantité, usage" required minLength={10} maxLength={2000} />
        <label>Délai souhaité<input type="date" value={f.deadline} onChange={set("deadline")} /></label>
        <label>Fichier de référence (facultatif)<input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        <button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? "Envoi…" : "Envoyer la demande"}</button>
      </form>
    </div>
  );
}

// Galeries de la page photo (affichées au-dessus du choix studio / événementiel)
export function PhotoGallery() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    supabase.rpc("list_catalog", { p_catalog: "photo" }).then(({ data }) => setItems(Array.isArray(data) ? data : []));
  }, []);
  const withPhotos = items.filter((i) => (i.gallery || []).length > 0);
  if (withPhotos.length === 0) return null;
  return (
    <div className="catalog-grid photo-gallery">
      {withPhotos.map((it) => <ItemCard key={it.id} item={it} catalog="photo" onQuote={() => go("photo")} />)}
    </div>
  );
}

// Administration : articles, galeries (3 à 5 photos) et demandes de devis
export function CatalogAdmin({ onNotify }) {
  const [items, setItems] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [form, setForm] = useState({ catalog: "design", title: "", description: "", price_text: "Devis après étude" });
  const [galleryFor, setGalleryFor] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  async function load() {
    const i = await supabase.from("catalog_items").select("*").order("catalog").order("position");
    if (i.error) onNotify?.(errMsg(i.error)); else setItems(i.data || []);
    const q = await supabase.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(100);
    if (!q.error) setQuotes(q.data || []);
  }
  useEffect(() => { load(); }, []);

  async function addItem(e) {
    e.preventDefault();
    if (form.title.trim().length < 2) { onNotify?.("Indique un titre."); return; }
    const { error } = await supabase.from("catalog_items").insert({ catalog: form.catalog, title: form.title.trim(), description: form.description.trim(), price_text: form.price_text.trim() || "Devis après étude" });
    if (error) { onNotify?.(errMsg(error)); return; }
    setForm({ ...form, title: "", description: "" }); onNotify?.("Article ajouté."); load();
  }
  async function togglePublish(it) {
    const { error } = await supabase.from("catalog_items").update({ is_published: !it.is_published }).eq("id", it.id);
    if (error) onNotify?.(errMsg(error)); else load();
  }
  async function removeItem(it) {
    if (!window.confirm("Supprimer cet article et ses photos ?")) return;
    const { error } = await supabase.from("catalog_items").delete().eq("id", it.id);
    if (error) onNotify?.(errMsg(error)); else load();
  }
  async function addPhotos(it) {
    const current = await supabase.from("catalog_gallery").select("id").eq("item_id", it.id);
    const count = current.data ? current.data.length : 0;
    if (count + galleryFiles.length > 5) { onNotify?.(`Une galerie ne peut pas dépasser 5 photos (actuellement ${count}).`); return; }
    if (galleryFiles.length === 0) { onNotify?.("Choisis des photos."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    try {
      for (let k = 0; k < galleryFiles.length; k++) {
        const file = galleryFiles[k];
        if (!file.type.startsWith("image/")) throw new Error("Seules les images sont acceptées.");
        const url = await uploadFile(user, file, "catalogue/");
        const { error } = await supabase.from("catalog_gallery").insert({ item_id: it.id, url, position: count + k + 1 });
        if (error) throw error;
      }
      onNotify?.("Photos ajoutées."); setGalleryFiles([]); setGalleryFor(null); load();
    } catch (err) { onNotify?.(errMsg(err)); }
  }
  async function removePhoto(itemId, url) {
    const { error } = await supabase.from("catalog_gallery").delete().eq("item_id", itemId).eq("url", url);
    if (error) onNotify?.(errMsg(error)); else load();
  }
  async function setQuote(id, status, note) {
    const { error } = await supabase.rpc("admin_update_quote", { p_id: id, p_status: status, p_note: note || "" });
    if (error) onNotify?.(errMsg(error)); else { onNotify?.("Demande mise à jour."); load(); }
  }

  return (
    <>
      <form className="account-content-card admin-form" onSubmit={addItem}>
        <h3>Ajouter un article</h3>
        <select value={form.catalog} onChange={(e) => setForm({ ...form, catalog: e.target.value })}>
          <option value="design">Services design et data</option>
          <option value="tableaux">Tableaux muraux</option>
          <option value="chine">Précommandes Chine</option>
          <option value="photo">Photographie</option>
        </select>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre" required maxLength={160} />
        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" maxLength={1000} />
        <input value={form.price_text} onChange={(e) => setForm({ ...form, price_text: e.target.value })} placeholder="Prix affiché (ex. Devis après étude)" maxLength={60} />
        <button type="submit" className="button button-outline">Ajouter</button>
      </form>

      <div className="account-content-card">
        <h3>Articles et galeries</h3>
        {items.map((it) => (
          <div key={it.id} className="admin-row admin-item">
            <div>
              <strong>{it.title}</strong>
              <p>{it.catalog} · {it.price_text} · {it.is_published ? "publié" : "masqué"}</p>
            </div>
            <div className="admin-row-actions">
              <button type="button" className="button button-outline" onClick={() => togglePublish(it)}>{it.is_published ? "Masquer" : "Publier"}</button>
              <button type="button" className="button button-outline" onClick={() => setGalleryFor(galleryFor === it.id ? null : it.id)}>Photos</button>
              <button type="button" className="button button-danger" onClick={() => removeItem(it)}>Supprimer</button>
            </div>
            {galleryFor === it.id && (
              <div className="gallery-admin">
                <input type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))} />
                <button type="button" className="button button-primary" onClick={() => addPhotos(it)}>Ajouter les photos (max. 5 au total)</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="account-content-card">
        <h3>Demandes de devis</h3>
        {quotes.length === 0 && <p>Aucune demande.</p>}
        {quotes.map((q) => (
          <QuoteRow key={q.id} q={q} onSave={setQuote} />
        ))}
      </div>
    </>
  );
}

function QuoteRow({ q, onSave }) {
  const [note, setNote] = useState(q.admin_note || "");
  return (
    <div className="admin-row admin-quote">
      <div>
        <strong>{q.name}</strong> <small>· {q.catalog} · {q.item_title || "demande générale"}</small>
        <p>{q.phone}{q.email ? ` · ${q.email}` : ""}</p>
        <p>{q.need}</p>
        {q.deadline && <small>Délai : {q.deadline}</small>}
        {q.file_url && <a href={q.file_url} target="_blank" rel="noopener noreferrer">Fichier joint</a>}
      </div>
      <div className="admin-row-actions">
        <select value={q.status} onChange={(e) => onSave(q.id, e.target.value, note)}>
          <option value="new">Nouvelle</option>
          <option value="in_progress">En cours</option>
          <option value="quoted">Devis envoyé</option>
          <option value="closed">Clôturée</option>
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note interne" maxLength={1000} />
        <button type="button" className="button button-outline" onClick={() => onSave(q.id, q.status, note)}>Enregistrer la note</button>
      </div>
    </div>
  );
}

// Commande de tableau : options, calcul en direct, paiement ou demande de devis
export function TableauOrder({ item, onClose }) {
  const [settings, setSettings] = useState(null);
  const [f, setF] = useState({ quantity: 1, plexiglas: false, multi: false, delivery: false, express: false, frames: 0, name: "", phone: "" });
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.rpc("get_price_settings").then(({ data }) => setSettings(data || {})); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  if (!settings) return <div className="modal-backdrop"><div className="auth-modal"><p>Chargement…</p></div></div>;
  const cfg = {
    sizes: { [item.id]: item.price_xaf || 0 },
    framePrice: Number(settings.frame_price) > 0 ? Number(settings.frame_price) : null,
    express: { available: Number(settings.express_available) === 1, fee: Number(settings.express_fee ?? 2000) },
    deliveryFrom: null,
    montageFee: Number(settings.montage_fee ?? 1000),
  };
  const q = frameQuote({ size: item.id, quantity: Number(f.quantity) || 1, plexiglas: f.plexiglas, multiPhoto: f.multi,
    delivery: f.delivery, express: f.express, frameCount: Number(f.frames) || 0 }, cfg);
  const fmt = (n) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`;

  async function send(event) {
    event.preventDefault();
    if (f.name.trim().length < 2 || f.phone.trim().length < 5) { notify("Nom et téléphone obligatoires."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_tableau_order", { p_payload: {
      item_id: item.id, quantity: Number(f.quantity) || 1, plexiglas: f.plexiglas, multi_photo: f.multi,
      delivery: f.delivery, express: f.express, frames: Number(f.frames) || 0, name: f.name, phone: f.phone } });
    setBusy(false);
    if (error) { notify(errMsg(error)); return; }
    if (data.mode === "quote") { notify("Ta commande contient des éléments à confirmer : demande de devis envoyée."); onClose(); return; }
    setOrder({ id: data.order_id, amount: data.amount });
  }

  if (order) return (
    <div className="modal-backdrop"><div className="auth-modal quote-modal">
      <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
      <h2>Paiement de ta commande</h2>
      <PaymentFlow amount={order.amount}
        onSubmit={async ({ transactionId, proofUrl }) => {
          const { error } = await supabase.rpc("submit_photo_payment", { p_order: order.id, p_tx: transactionId, p_proof: proofUrl });
          if (error) throw error;
        }}
        onDone={() => notify("Paiement envoyé. L'équipe confirme ta commande.")}
        doneMessage="Paiement envoyé. L'équipe vérifie ton paiement : tu recevras la confirmation dans tes notifications." />
    </div></div>
  );

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="auth-modal quote-modal" onSubmit={send} role="dialog" aria-modal="true" aria-label="Commander un tableau">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>Commander</h2>
        <p className="auth-description">{item.title}</p>
        <label>Quantité<input type="number" min="1" max="50" value={f.quantity} onChange={set("quantity")} /></label>
        <label className="admin-check"><input type="checkbox" checked={f.plexiglas} onChange={set("plexiglas")} /> Plexiglas (double le prix du tableau)</label>
        <label className="admin-check"><input type="checkbox" checked={f.multi} onChange={set("multi")} /> Montage de plusieurs photos (+ {fmt(cfg.montageFee)})</label>
        <label className="admin-check"><input type="checkbox" checked={f.delivery} onChange={set("delivery")} /> Livraison (tarif selon la zone)</label>
        <label className="admin-check"><input type="checkbox" checked={f.express} onChange={set("express")} disabled={!cfg.express.available} /> Commande express {cfg.express.available ? `(+ ${fmt(cfg.express.fee)})` : "(non disponible)"}</label>
        <label>Nombre de cadres<input type="number" min="0" value={f.frames} onChange={set("frames")} /></label>
        <input value={f.name} onChange={set("name")} placeholder="Nom complet" required maxLength={120} />
        <input value={f.phone} onChange={set("phone")} placeholder="Téléphone" required maxLength={30} />
        <div className="quote-box">
          {q.lines.map((l, i) => <div key={i} className="quote-line"><span>{l.label}</span><b>{fmt(l.amount)}</b></div>)}
          <div className="quote-total"><span>Total estimé</span><b>{fmt(q.total)}</b></div>
          {q.pending.map((p, i) => <small key={i}>⚠ {p}</small>)}
        </div>
        <button type="submit" className="button button-primary button-full" disabled={busy}>
          {busy ? "Envoi…" : q.pending.length ? "Envoyer en demande de devis" : "Commander et payer"}
        </button>
      </form>
    </div>
  );
}
