import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { imageUrl } from "./imageCatalog";
import WorkshopReservationsAdmin from "./WorkshopReservationsAdmin";
import TicketPayment from "./TicketPayment";

const asset = (name) => imageUrl(name);
const TICKET_PRICE = 2500;

function money(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

export default function AtelierSection({ user, profile, role, onNotify }) {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || user?.user_metadata?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ title: "", description: "", image_url: "", starts_at: "", location: "" });
  const [publishing, setPublishing] = useState(false);
  const [participants, setParticipants] = useState({});
  const [payment, setPayment] = useState(null);

  async function loadWorkshops() {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("workshops")
      .select("id, title, description, image_url, starts_at, location, status, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (queryError) {
      console.error("Chargement des ateliers :", queryError.message);
      setWorkshops([]);
      setError("Les ateliers ne sont pas encore configurés. Réessaie plus tard.");
    } else {
      const rows = data || [];
      setWorkshops(rows);
      setError("");
      const participantResults = await Promise.all(rows.map(async (workshop) => {
        const result = await supabase.rpc("get_workshop_confirmed_participants", { p_workshop_id: workshop.id });
        return [workshop.id, result.error ? [] : (Array.isArray(result.data) ? result.data : [])];
      }));
      setParticipants(Object.fromEntries(participantResults));
    }
    setLoading(false);
  }

  useEffect(() => { loadWorkshops(); }, []);
  useEffect(() => {
    setFullName(profile?.full_name || user?.user_metadata?.full_name || "");
    setPhone(profile?.phone || user?.user_metadata?.phone || "");
  }, [profile?.full_name, profile?.phone, user?.user_metadata?.full_name]);

  async function publishWorkshop(event) {
    event.preventDefault();
    setPublishing(true);
    setError("");
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      image_url: draft.image_url.trim() || null,
      starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
      location: draft.location.trim() || null,
      status: "published",
      created_by: user?.id || null,
    };
    const { error: publishError } = await supabase.from("workshops").insert(payload);
    setPublishing(false);
    if (publishError) {
      console.error("Publication atelier :", publishError.message);
      setError("Publication impossible. Vérifie ton rôle et les règles Supabase.");
      return;
    }
    setDraft({ title: "", description: "", image_url: "", starts_at: "", location: "" });
    onNotify?.("Atelier publié.");
    await loadWorkshops();
  }

  async function deleteWorkshop(item) {
    if (!window.confirm(`Supprimer l'atelier « ${item.title} » ? Les réservations associées seront également supprimées.`)) return;
    const { error: deleteError } = await supabase.from("workshops").delete().eq("id", item.id);
    if (deleteError) {
      console.error("Suppression atelier :", deleteError.message);
      onNotify?.("Impossible de supprimer cet atelier.");
      return;
    }
    onNotify?.("Atelier supprimé.");
    await loadWorkshops();
  }

  async function reserve(event) {
    event.preventDefault();
    if (!user) {
      onNotify?.("Connecte-toi pour préparer une réservation.");
      return;
    }
    if (!selected) return;
    if (!fullName.trim() || !phone.trim()) {
      setError("Renseigne ton nom complet et ton numéro de téléphone.");
      return;
    }
    setSaving(true);
    setError("");
    // Réservation uniquement en attente : aucun ticket n'est confirmé sans vérification du paiement côté serveur.
    const { data: reservationData, error: insertError } = await supabase.rpc("create_workshop_reservation", {
      p_workshop_id: selected.id,
      p_full_name: fullName.trim(),
      p_phone: phone.trim(),
    });
    setSaving(false);
    if (insertError) {
      console.error("Réservation atelier :", insertError.message);
      setError(insertError.message.includes("function")
        ? "Le module de réservation doit d'abord être configuré dans Supabase."
        : "Impossible de préparer la réservation. Vérifie les informations puis réessaie.");
      return;
    }
    setPayment({ id: reservationData?.reservation_id, title: selected.title });
    setSelected(null);
    onNotify?.("Réservation enregistrée. Suis les étapes de paiement.");
  }

  return (
    <section className="atelier-section section-container">
      <div className="atelier-hero">
        <img src={asset("interface-atelier-1.png")} alt="Ateliers ED BUSINESS CENTER" />
        <div className="atelier-hero-copy">
          <span className="eyebrow">APPRENDRE · PRATIQUER · ENTREPRENDRE</span>
          <h1>Les ateliers ED BUSINESS CENTER</h1>
          <p>Découvre les ateliers, les projets et les rencontres pratiques de notre communauté.</p>
        </div>
      </div>

      <div className="atelier-intro-grid">
        <article><img src={asset("publication-atelier-01-decouvrir-les-ateliers.png")} alt="Découvrir les ateliers" loading="lazy" /><h2>Découvre les ateliers</h2><p>Consulte les informations, la date et le lieu de chaque activité publiée.</p></article>
        <article><img src={asset("atelier-visuel-paiement-securise.png")} alt="Information sur le paiement sécurisé" loading="lazy" /><h2>Prépare ta réservation</h2><p>Le tarif annoncé pour un ticket est de 2 500 FCFA. La réservation reste en attente jusqu'à la vérification du paiement.</p></article>
        <article><img src={asset("publication-atelier-03-confirmation-et-participants.png")} alt="Confirmation du ticket" loading="lazy" /><h2>Confirmation du ticket</h2><p>Seules les réservations dont le paiement a été vérifié peuvent être considérées comme confirmées.</p></article>
      </div>

      {(role === "admin" || role === "trainer") && <section className="atelier-manager"><span className="eyebrow">ESPACE ÉQUIPE AUTORISÉE</span><h2>Publier un atelier</h2><form className="atelier-manager-form" onSubmit={publishWorkshop}><label>Titre de l'atelier<input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} required minLength={3} maxLength={180} /></label><label>Description<textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} rows={3} maxLength={5000} required /></label><label>URL de l'affiche (facultatif)<input type="url" value={draft.image_url} onChange={(e) => setDraft((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://…" /></label><div className="atelier-manager-fields"><label>Date et heure<input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft((p) => ({ ...p, starts_at: e.target.value }))} /></label><label>Lieu<input value={draft.location} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))} maxLength={180} /></label></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={publishing}>{publishing ? "Publication…" : "Publier l'atelier"}</button></form></section>}
      <div className="atelier-section-heading"><div><span className="eyebrow">PROGRAMME</span><h2>Ateliers disponibles</h2></div><span className="atelier-price-badge">Ticket : {money(TICKET_PRICE)}</span></div>
      {role === "admin" && <WorkshopReservationsAdmin onNotify={onNotify} />}
      {loading ? <div className="community-empty">Chargement des ateliers…</div> : error && workshops.length === 0 ? <div className="community-empty"><img src={asset("atelier-visuel-aucun-evenement.png")} alt="Aucun atelier disponible" /><h2>Aucun atelier affiché pour le moment</h2><p>{error}</p></div> : workshops.length === 0 ? <div className="community-empty"><img src={asset("atelier-visuel-aucun-evenement.png")} alt="Aucun atelier disponible" /><h2>Aucun atelier disponible pour le moment</h2><p>Reviens bientôt pour découvrir les prochaines activités.</p></div> : <div className="atelier-card-grid">{workshops.map((item) => <article className="atelier-card" key={item.id}>{item.image_url ? <img className="atelier-card-image" src={item.image_url} alt={item.title} loading="lazy" /> : <img className="atelier-card-image" src={asset("interface-atelier-1.png")} alt="Atelier ED BUSINESS CENTER" loading="lazy" />}<div className="atelier-card-body"><span className="atelier-price-badge">{money(TICKET_PRICE)}</span><h3>{item.title}</h3><p>{item.description}</p><div className="atelier-meta">{item.starts_at && <span>📅 {new Date(item.starts_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>}{item.location && <span>📍 {item.location}</span>}</div><button className="button button-primary" type="button" onClick={() => { setSelected(item); setError(""); }}>Réserver mon ticket</button><div className="atelier-confirmed-participants"><img className="atelier-participants-preview" src={asset("interface-participants-atelier.png")} alt="Liste des participants confirmés" loading="lazy"/><h4>Participants confirmés ({(participants[item.id] || []).length})</h4><p>Seules les personnes dont le paiement est vérifié apparaissent ici.</p>{(participants[item.id] || []).length > 0 ? <div className="atelier-participant-list">{participants[item.id].map((person, index) => <div className="atelier-participant" key={`${person.full_name}-${index}`}>{person.avatar_url ? <img src={person.avatar_url} alt="" loading="lazy" /> : <span>{(person.full_name || "M").split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span>}<strong>{person.full_name}</strong></div>)}</div> : <small>Aucun participant confirmé pour le moment.</small>}</div>{(role === "admin" || role === "trainer") && <button className="button button-outline atelier-delete-button" type="button" onClick={() => deleteWorkshop(item)}>Supprimer l'atelier</button>}</div></article>)}</div>}

      {selected && <div className="atelier-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="atelier-reservation-modal" role="dialog" aria-modal="true" aria-labelledby="atelier-reservation-title"><button className="atelier-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Fermer">×</button><img src={asset("interface-reservation-atelier.png")} alt="Réservation d'atelier" /><span className="eyebrow">RÉSERVATION</span><h2 id="atelier-reservation-title">{selected.title}</h2><p>Prix du ticket : <strong>{money(TICKET_PRICE)}</strong></p>{!user ? <div className="atelier-pending-note">Connecte-toi à ton compte pour préparer une réservation.</div> : <form onSubmit={reserve} className="atelier-reservation-form"><label>Nom complet<input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} autoComplete="name" /></label><label>Numéro de téléphone<input value={phone} onChange={(event) => setPhone(event.target.value)} required maxLength={30} autoComplete="tel" /></label><div className="atelier-pending-note"><img className="atelier-payment-safe-image" src={asset("atelier-visuel-paiement-securise.png")} alt="Paiement à vérifier avant confirmation" loading="lazy" />La demande sera enregistrée en attente. Le ticket ne sera confirmé qu'après intégration et vérification du paiement sécurisé.</div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Préparer ma réservation"}</button></form>}</section></div>}
      {payment && <TicketPayment payment={payment} onClose={() => setPayment(null)} onNotify={onNotify} />}
    </section>
  );
}
