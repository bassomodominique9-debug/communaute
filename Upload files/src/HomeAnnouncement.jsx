import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { imageUrl } from "./imageCatalog";
import CoursePayment from "./CoursePayment";
import { useSlot } from "./mediaSlots";

const WA_URL = "https://wa.me/237690275953";
const notify = (message) => window.dispatchEvent(new CustomEvent("ed-bcenter-notify", { detail: message }));

export default function HomeAnnouncement() {
  const [item, setItem] = useState(null);
  const [open, setOpen] = useState(false);
  const [reg, setReg] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const override = useSlot("announcement_image");

  useEffect(() => {
    let active = true;
    supabase.from("home_announcement").select("*").eq("singleton", true).maybeSingle().then(({ data, error }) => {
      if (active && !error && data && !Array.isArray(data)) setItem(data);
    });
    return () => { active = false; };
  }, []);

  if (!item || !item.is_published) return null;

  const date = item.event_date ? new Date(`${item.event_date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
  const facts = [["Jour", item.event_day], ["Date", date], ["Prix", item.price]].filter(([, v]) => v);
  const title = item.title || "Programme";

  async function register(event) {
    event.preventDefault();
    if (form.full_name.trim().length < 2 || form.phone.trim().length < 5) { notify("Indique ton nom et ton téléphone."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("register_for_course", {
      p_course_title: title,
      p_full_name: form.full_name.trim(),
      p_phone: form.phone.trim(),
      p_email: form.email.trim() || null,
      p_message: null,
      p_course_key: "annonce-programme",
      p_amount: item.price_xaf ?? null,
    });
    setBusy(false);
    if (error) { notify(error.message); return; }
    setOpen(false);
    setReg({ id: data?.registration_id || null, price: item.price_xaf });
  }

  return (
    <section className="home-announcement section-container" aria-label="Annonce">
      <figure className="home-announcement-image">
        <img src={override || (/^https?:\/\//i.test(item.image_name) ? item.image_name : imageUrl(item.image_name))} alt={item.title || "Annonce"} width="1122" height="1402" />
      </figure>
      <div className="home-announcement-info">
        <span className="eyebrow">ANNONCE</span>
        {item.title && <h2>{item.title}</h2>}
        {item.description && <p>{item.description}</p>}
        {facts.length > 0 ? (
          <dl className="announcement-facts">
            {facts.map(([label, value]) => (
              <div key={label} className={label === "Prix" ? "announcement-fact announcement-price" : "announcement-fact"}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : <p>Informations à venir.</p>}
        <button type="button" className="button button-primary announcement-join" onClick={() => setOpen(true)}>Participer</button>
      </div>

      {open && (
        <div className="modal-backdrop" role="presentation">
          <form className="auth-modal" onSubmit={register} role="dialog" aria-modal="true" aria-label="Participer au programme">
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            <h2>Participer</h2>
            <p className="auth-description">{title}</p>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nom complet" required maxLength={120} />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" required maxLength={30} />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail (facultatif)" maxLength={120} />
            <button type="submit" className="button button-primary button-full" disabled={busy}>{busy ? "Envoi…" : "Continuer"}</button>
          </form>
        </div>
      )}

      {reg && (
        <div className="modal-backdrop" role="presentation">
          <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Paiement">
            <button type="button" className="modal-close" onClick={() => setReg(null)} aria-label="Fermer">×</button>
            <h2>{title}</h2>
            <CoursePayment course={{ price: reg.price }} regId={reg.id} whatsapp={WA_URL} whatsappText={`Bonjour, j'ai une question sur ${title}`} onNotify={notify} />
          </div>
        </div>
      )}
    </section>
  );
}
