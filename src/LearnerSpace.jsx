import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AttachmentList, AttachmentPicker } from "./Attachments";

export const STATE = { actif: ["Actif", "eng-actif"], surveiller: ["À surveiller", "eng-surveiller"], inactif: ["Inactif", "eng-inactif"] };
export const fmt = (d) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "Sans limite");

export function Engagement({ data }) {
  if (!data) return null;
  const [label, cls] = STATE[data.state] || STATE.inactif;
  return (
    <div className="eng-card">
      <div className="eng-score"><strong>{data.score}</strong><small>/100</small></div>
      <div>
        <span className={`eng-chip ${cls}`}>{label}</span>
        <p>Rendus à temps : {data.rate} % · Moyenne : {data.graded ? `${data.average20}/20` : "—"}</p>
        <p>Dernière activité : {data.days_since == null ? "jamais" : data.days_since < 1 ? "aujourd'hui" : `il y a ${Math.round(data.days_since)} j`}</p>
      </div>
    </div>
  );
}

export default function LearnerSpace({ user, onNotify }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("todo");
  const [open, setOpen] = useState(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => supabase.rpc("learn_dashboard").then(({ data: d, error }) => {
    if (error) onNotify?.(/function|schema cache/i.test(error.message) ? "Installe le SQL « partie 16 » dans Supabase." : error.message); else setData(d);
  });
  useEffect(() => { load(); }, []);

  async function submit(a) {
    setBusy(true);
    const { error } = await supabase.rpc("learn_submit", { p_assignment: a.id, p_content: text.trim(), p_attachments: files });
    setBusy(false);
    if (error) { onNotify?.(error.message); return; }
    onNotify?.("Exercice rendu. Ton formateur sera prévenu."); setText(""); setFiles([]); setOpen(null); load();
  }

  if (!data) return <p>Chargement…</p>;
  if (!data.member) return <div className="account-content-card"><h3>Ton espace apprenant</h3><p>Il sera activé dès que l'équipe t'ajoutera à une promotion.</p></div>;
  const list = data.assignments || [];
  const graded = list.filter((a) => a.submission?.score != null);
  const status = (a) => (a.submission?.graded_at ? ["Noté", "eng-actif"] : a.submission ? ["Rendu", "eng-surveiller"] : a.due_at && new Date(a.due_at) < new Date() ? ["En retard", "eng-inactif"] : ["À faire", "eng-todo"]);

  return (
    <div className="account-tab-content">
      <Engagement data={data.engagement} />
      <div className="admin-tabs" role="tablist">
        {[["todo", "Exercices"], ["notes", "Mes notes"]].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === "todo" && list.map((a) => {
        const [sl, sc] = status(a);
        return (
          <div className="account-content-card" key={a.id}>
            <div className="admin-row" style={{ border: 0, padding: 0 }}>
              <div><strong>{a.title}</strong><p>{a.cohort} · Pour le {fmt(a.due_at)}</p></div>
              <span className={`eng-chip ${sc}`}>{sl}</span>
            </div>
            {a.submission?.graded_at && <div className="toast-inline"><b>{a.submission.score}/{a.max_points}</b>{a.submission.feedback && <p>« {a.submission.feedback} »</p>}</div>}
            <button type="button" className="button button-outline" onClick={() => { setOpen(open === a.id ? null : a.id); setText(a.submission?.content || ""); setFiles([]); }}>{open === a.id ? "Fermer" : a.submission ? "Voir" : "Ouvrir"}</button>
            {open === a.id && (
              <div className="admin-form">
                <p>{a.instructions}</p><AttachmentList items={a.attachments} />
                {a.submission?.graded_at ? <p>Exercice déjà noté.</p> : (<>
                  <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ta réponse, ton explication…" maxLength={3000} />
                  <AttachmentPicker user={user} value={files} onChange={setFiles} full max={4} onNotify={onNotify} />
                  <button type="button" className="button button-primary" disabled={busy} onClick={() => submit(a)}>{busy ? "Envoi…" : a.submission ? "Rendre à nouveau" : "Rendre mon travail"}</button>
                </>)}
              </div>
            )}
          </div>
        );
      })}
      {tab === "todo" && list.length === 0 && <p>Aucun exercice pour le moment.</p>}
      {tab === "notes" && (
        <div className="account-content-card">
          <h3>Mes notes</h3>
          {graded.length === 0 && <p>Aucune note pour le moment.</p>}
          {graded.map((a) => <div className="admin-row" key={a.id}><div><strong>{a.title}</strong><p>{a.submission.feedback || ""}</p></div><span className="header-points">{a.submission.score}/{a.max_points}</span></div>)}
          {graded.length > 0 && <p><b>Moyenne : {data.engagement.average20}/20</b></p>}
        </div>
      )}
    </div>
  );
}
