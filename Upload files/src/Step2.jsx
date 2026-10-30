import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import CoursePayment from "./CoursePayment";

function Shell({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="auth-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

/* Inscription à une formation : enregistre la demande puis ouvre WhatsApp */
export function CourseEnrollModal({ course, user, profile, whatsapp, onClose, onNotify }) {
  const [name, setName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [regId, setRegId] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 5) { setError("Renseigne ton nom et ton numéro de téléphone."); return; }
    setBusy(true);
    setError("");
    const { data: regData, error: err } = await supabase.rpc("register_for_course", {
      p_course_key: course.id, p_amount: course.price ?? null,
      p_course_title: course.title, p_full_name: name.trim(), p_phone: phone.trim(),
      p_email: email.trim() || null, p_message: message.trim() || null,
    });
    setBusy(false);
    if (err) { setError(err.message.includes("function") ? "Le SQL « partie 6 » doit être installé dans Supabase." : "Impossible d'enregistrer la demande. Réessaie."); return; }
    setRegId(regData?.registration_id || null);
    setDone(true);
    onNotify?.("Inscription enregistrée. Suis les étapes de paiement.");
  }

  const text = `Bonjour, je souhaite m'inscrire à la formation « ${course.title} ». Nom : ${name.trim()}. Téléphone : ${phone.trim()}.`;
  return (
    <Shell title="Inscription à la formation" onClose={onClose}>
      <p className="auth-description"><strong>{course.title}</strong></p>
      {done ? (
        <CoursePayment course={course} regId={regId} whatsapp={whatsapp} whatsappText={text} onNotify={onNotify} />
      ) : (
        <form onSubmit={submit}>
          <label className="form-field">Nom complet<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" /></label>
          <label className="form-field">Téléphone<input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} autoComplete="tel" /></label>
          <label className="form-field">E-mail (facultatif)<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} autoComplete="email" /></label>
          <label className="form-field">Message (facultatif)<textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? "Envoi…" : "Envoyer ma demande"}</button>
        </form>
      )}
    </Shell>
  );
}

/* Mot de passe oublié : envoi du lien par e-mail */
export function ForgotPasswordModal({ onClose, onBack }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + window.location.pathname,
    });
    setBusy(false);
    if (err) { setError("Impossible d'envoyer l'e-mail pour le moment. Réessaie dans quelques minutes."); return; }
    setSent(true);
  }

  return (
    <Shell title="Mot de passe oublié" onClose={onClose}>
      {sent ? (
        <p>Si cette adresse correspond à un compte, un e-mail avec un lien de réinitialisation vient d'être envoyé. Pense à vérifier tes courriers indésirables.</p>
      ) : (
        <form onSubmit={submit}>
          <p className="auth-description">Entre l'adresse e-mail de ton compte pour recevoir un lien.</p>
          <label className="form-field">E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? "Envoi…" : "Envoyer le lien"}</button>
        </form>
      )}
      <button type="button" className="button button-outline button-full" onClick={onBack}>Retour à la connexion</button>
    </Shell>
  );
}

/* Choix du nouveau mot de passe après clic sur le lien reçu par e-mail */
export function PasswordRecoveryModal({ onClose, onNotify }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne sont pas identiques."); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) { setError("Impossible de modifier le mot de passe. Redemande un lien."); return; }
    onNotify?.("Mot de passe modifié avec succès.");
    onClose();
  }

  return (
    <Shell title="Nouveau mot de passe" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="form-field">Nouveau mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" /></label>
        <label className="form-field">Confirmer<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
      </form>
    </Shell>
  );
}

/* Administrateur / formatrice : publier ou retirer un service */
export function ServiceManager({ onNotify }) {
  const [form, setForm] = useState({ name: "", category: "", image_name: "", description: "", details: "" });
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function load() {
    const { data } = await supabase.from("services").select("id, name").order("created_at", { ascending: false });
    setList(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("services").insert({
      name: form.name.trim(), category: form.category.trim() || "Service", image_name: form.image_name.trim() || null,
      description: form.description.trim(), details: form.details.split("\n").map((l) => l.trim()).filter(Boolean),
    });
    setBusy(false);
    if (error) { onNotify?.("Service non publié : " + (error.message.includes("services") ? "installe d'abord le SQL « partie 6 »." : error.message)); return; }
    onNotify?.("Service publié.");
    setForm({ name: "", category: "", image_name: "", description: "", details: "" });
    window.dispatchEvent(new Event("ed-services-updated"));
    load();
  }

  async function remove(item) {
    const { error } = await supabase.from("services").delete().eq("id", item.id);
    if (error) { onNotify?.(error.message); return; }
    window.dispatchEvent(new Event("ed-services-updated"));
    load();
  }

  return (
    <section className="account-content-card section-container admin-highlight">
      <span className="eyebrow">ESPACE ÉQUIPE AUTORISÉE</span>
      <h2>Publier un service</h2>
      <form onSubmit={save}>
        <label className="form-field">Nom du service<input value={form.name} onChange={set("name")} required maxLength={80} /></label>
        <label className="form-field">Catégorie<input value={form.category} onChange={set("category")} maxLength={60} /></label>
        <label className="form-field">Image (nom du catalogue ou lien)<input value={form.image_name} onChange={set("image_name")} placeholder="service-ed-b-solutions.png" /></label>
        <label className="form-field">Description<textarea value={form.description} onChange={set("description")} rows={3} maxLength={400} /></label>
        <label className="form-field">Points forts (un par ligne)<textarea value={form.details} onChange={set("details")} rows={3} /></label>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Publication…" : "Publier le service"}</button>
      </form>
      {list.map((item) => (
        <div key={item.id} className="profile-detail-row"><strong>{item.name}</strong><button type="button" className="button button-danger" onClick={() => remove(item)}>Retirer</button></div>
      ))}
    </section>
  );
}
