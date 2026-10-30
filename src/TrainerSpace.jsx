import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AttachmentList, AttachmentPicker } from "./Attachments";
import { Engagement, fmt, STATE } from "./LearnerSpace";

export default function TrainerSpace({ user, onNotify }) {
  const [cohorts, setCohorts] = useState(null);
  const [cid, setCid] = useState(null);
  const [ov, setOv] = useState(null);
  const [tab, setTab] = useState("learners");
  const [f, setF] = useState({ title: "", instructions: "", due: "", max: 20 });
  const [files, setFiles] = useState([]);
  const [grades, setGrades] = useState({});
  const fail = (e) => onNotify?.(/function|schema cache/i.test(e.message) ? "Installe le SQL « partie 16 » dans Supabase." : e.message);

  useEffect(() => { supabase.rpc("trainer_cohorts").then(({ data, error }) => { if (error) fail(error); else { setCohorts(data || []); if (data?.[0]) setCid(data[0].id); } }); }, []);
  const loadOv = () => cid && supabase.rpc("trainer_overview", { p_cohort: cid }).then(({ data, error }) => { if (error) fail(error); else setOv(data); });
  useEffect(() => { setOv(null); loadOv(); }, [cid]);

  async function create(e) {
    e.preventDefault();
    const { error } = await supabase.rpc("trainer_create_assignment", { p_cohort: cid, p_title: f.title.trim(), p_instructions: f.instructions.trim(), p_due: f.due ? new Date(f.due).toISOString() : null, p_max: Number(f.max) || 20, p_attachments: files });
    if (error) { fail(error); return; }
    onNotify?.("Exercice publié. Les apprenants sont prévenus."); setF({ title: "", instructions: "", due: "", max: 20 }); setFiles([]); loadOv();
  }
  async function grade(s) {
    const g = grades[s.id] || {};
    const { error } = await supabase.rpc("trainer_grade", { p_submission: s.id, p_score: Number(g.score), p_feedback: (g.feedback || "").trim() });
    if (error) { fail(error); return; }
    onNotify?.("Note enregistrée."); loadOv();
  }

  if (!cohorts) return <p>Chargement…</p>;
  if (cohorts.length === 0) return <div className="account-content-card"><h3>Espace formateur</h3><p>Aucune promotion ne t'est assignée pour le moment.</p></div>;
  return (
    <div className="account-tab-content">
      <div className="admin-tabs">{cohorts.map((c) => <button key={c.id} type="button" className={cid === c.id ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => setCid(c.id)}>{c.name} ({c.members})</button>)}</div>
      <div className="admin-tabs" role="tablist">{[["learners", "Apprenants"], ["tasks", "Exercices"], ["grade", `À corriger${ov ? ` (${ov.pending.length})` : ""}`]].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => setTab(k)}>{l}</button>)}</div>
      {!ov && <p>Chargement…</p>}
      {ov && tab === "learners" && (
        <div className="account-content-card">
          <h3>Suivi de la promotion</h3>
          {ov.learners.length === 0 && <p>Aucun apprenant dans cette promotion.</p>}
          {ov.learners.map((l) => <div className="admin-row" key={l.id}><div><strong>{l.name}</strong><p>Rendus à temps : {l.engagement.rate} % · {l.engagement.graded ? `${l.engagement.average20}/20` : "pas de note"}</p></div><div><span className={`eng-chip ${(STATE[l.engagement.state] || STATE.inactif)[1]}`}>{l.engagement.score} · {(STATE[l.engagement.state] || STATE.inactif)[0]}</span></div></div>)}
        </div>
      )}
      {ov && tab === "tasks" && (
        <>
          <form className="account-content-card admin-form" onSubmit={create}>
            <h3>Nouvel exercice</h3>
            <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Titre" required maxLength={120} />
            <textarea rows={4} value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} placeholder="Consigne" required />
            <label>Date limite<input type="datetime-local" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></label>
            <label>Note maximale<input type="number" min="1" max="100" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></label>
            <AttachmentPicker user={user} value={files} onChange={setFiles} full max={4} onNotify={onNotify} />
            <button type="submit" className="button button-primary">Publier l'exercice</button>
          </form>
          <div className="account-content-card"><h3>Exercices publiés</h3>{ov.assignments.map((a) => <div className="admin-row" key={a.id}><div><strong>{a.title}</strong><p>Pour le {fmt(a.due_at)}</p></div><span className="header-points">{a.submitted}/{ov.learners.length}</span></div>)}</div>
        </>
      )}
      {ov && tab === "grade" && (
        <div className="account-content-card">
          <h3>Travaux à corriger</h3>
          {ov.pending.length === 0 && <p>Tout est corrigé. Bravo !</p>}
          {ov.pending.map((s) => (
            <div className="admin-form" key={s.id} style={{ borderBottom: "1px solid var(--ed-border)", paddingBottom: 12 }}>
              <strong>{s.learner} — {s.assignment_title}</strong><small>Rendu le {fmt(s.submitted_at)} · sur {s.max_points}</small>
              <p>{s.content}</p><AttachmentList items={s.attachments} />
              <input type="number" min="0" max={s.max_points} step="0.5" placeholder={`Note sur ${s.max_points}`} value={grades[s.id]?.score ?? ""} onChange={(e) => setGrades({ ...grades, [s.id]: { ...grades[s.id], score: e.target.value } })} />
              <input placeholder="Commentaire pour l'apprenant" value={grades[s.id]?.feedback ?? ""} onChange={(e) => setGrades({ ...grades, [s.id]: { ...grades[s.id], feedback: e.target.value } })} />
              <button type="button" className="button button-primary" onClick={() => grade(s)}>Enregistrer la note</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
