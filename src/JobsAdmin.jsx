import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 24 » dans Supabase." : e?.message || "Erreur");

export default function JobsAdmin({ onNotify }) {
  const [data, setData] = useState({ offers: [], recruiters: [], seekers: [] });
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    const { data: d, error } = await supabase.rpc("admin_list_jobs");
    if (error) onNotify?.(errMsg(error)); else setData({ offers: d?.offers || [], recruiters: d?.recruiters || [], seekers: d?.seekers || [] });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id, publish) {
    const { error } = await supabase.rpc("admin_confirm_job", { p_offer: id, p_publish: publish, p_note: notes[id] || null });
    if (error) { onNotify?.(errMsg(error)); return; }
    onNotify?.(publish ? "Offre publiée." : "Offre rejetée."); load();
  }

  async function verify(userId, ok) {
    const { error } = await supabase.rpc("admin_verify_recruiter", { p_user: userId, p_ok: ok, p_notes: notes[userId] || "" });
    if (error) { onNotify?.(errMsg(error)); return; }
    onNotify?.(ok ? "Employeur vérifié." : "Vérification retirée."); load();
  }

  return (
    <>
      <div className="account-content-card">
        <h3>Offres en attente de confirmation</h3>
        {data.offers.length === 0 && <p>Aucune offre.</p>}
        {data.offers.map((o) => (
          <div key={o.id} className="admin-row">
            <div>
              <strong>{o.title}</strong><p>{o.company} · {o.status} · paiement {o.payment_status}</p>
              {o.transaction_id && <p>ID : {o.transaction_id}</p>}
              {o.proof_url && <a href={o.proof_url} target="_blank" rel="noopener noreferrer">Voir la preuve</a>}
            </div>
            {o.status === "pending" && (
              <div className="admin-row-actions">
                <input placeholder="Motif (si rejet)" value={notes[o.id] || ""} onChange={(e) => setNotes({ ...notes, [o.id]: e.target.value })} />
                <button type="button" className="button button-primary" onClick={() => decide(o.id, true)}>Publier</button>
                <button type="button" className="button button-danger" onClick={() => decide(o.id, false)}>Rejeter</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="account-content-card">
        <h3>Employeurs</h3>
        {data.recruiters.map((r) => (
          <div key={r.user_id} className="admin-row">
            <div><strong>{r.company}</strong><p>{r.contact} · {r.phone} · {r.verified ? "✓ Vérifié" : "Non vérifié"}</p></div>
            <div className="admin-row-actions">
              <input placeholder="Notes de vérification" value={notes[r.user_id] || ""} onChange={(e) => setNotes({ ...notes, [r.user_id]: e.target.value })} />
              <button type="button" className="button button-primary" onClick={() => verify(r.user_id, !r.verified)}>{r.verified ? "Retirer" : "Vérifier"}</button>
            </div>
          </div>
        ))}
      </div>
      <div className="account-content-card">
        <h3>Profils recherche d'emploi (confidentiels)</h3>
        {data.seekers.map((s) => (
          <div key={s.user_id} className="admin-row">
            <div><strong>{s.full_name}</strong><p>{s.phone} · {s.skills} · {s.city}, {s.country}</p></div>
            {s.cv_url && <a href={s.cv_url} target="_blank" rel="noopener noreferrer">CV</a>}
          </div>
        ))}
      </div>
    </>
  );
}
