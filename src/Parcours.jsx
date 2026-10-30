import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AttachmentList, AttachmentPicker } from "./Attachments";
import { ATT_LABEL, STATE_CLASS, STATE_LABEL, badgesFor, errText, fmtDate, fmtDay, fmtNum, gradeStatus, pct } from "./parcoursLib";
import "./parcours.css";

const TABS = [["accueil", "Accueil"], ["exercices", "Exercices"], ["modules", "Modules"], ["notes", "Notes"], ["presence", "Présence"], ["questions", "Questions"], ["portfolio", "Portfolio"]];

export default function Parcours({ user, onNotify }) {
  const [cohort, setCohort] = useState(undefined);
  const [tab, setTab] = useState("accueil");
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [question, setQuestion] = useState("");
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pFiles, setPFiles] = useState([]);

  useEffect(() => {
    supabase.from("pc_cohort_members").select("pc_cohorts(id, name, course_title)").eq("user_id", user.id).limit(1).then(({ data: rows, error }) => {
      if (error) { onNotify?.(errText(error)); setCohort(null); return; }
      setCohort(rows?.[0]?.pc_cohorts || null);
    });
  }, [user.id]);

  const load = useCallback(async () => {
    if (!cohort) return;
    const cid = cohort.id;
    const res = await Promise.all([
      supabase.from("pc_exercises").select("*").eq("cohort_id", cid).eq("is_published", true).order("due_at", { ascending: true, nullsFirst: false }),
      supabase.from("pc_submissions").select("*").eq("learner_id", user.id),
      supabase.rpc("learner_modules", { p_cohort: cid }),
      supabase.rpc("my_engagement", { p_cohort: cid }),
      supabase.from("pc_attendance_marks").select("status, pc_attendance_sessions!inner(session_date, label, mode, cohort_id)").eq("learner_id", user.id).eq("pc_attendance_sessions.cohort_id", cid),
      supabase.from("pc_learner_questions").select("*").eq("learner_id", user.id).eq("cohort_id", cid).order("created_at", { ascending: false }),
      supabase.from("pc_portfolio_items").select("*").eq("learner_id", user.id).order("created_at", { ascending: false }),
    ]);
    const err = res.find((r) => r.error)?.error;
    if (err) onNotify?.(errText(err));
    setData({
      pc_exercises: res[0].data || [], subs: res[1].data || [],
      modules: Array.isArray(res[2].data) ? res[2].data : [],
      eng: res[3].data || null, marks: res[4].data || [],
      questions: res[5].data || [], portfolio: res[6].data || [],
    });
  }, [cohort, user.id]);

  useEffect(() => { load(); }, [load]);

  async function ask(event) {
    event.preventDefault();
    if (!question.trim()) return;
    const { error } = await supabase.rpc("ask_question", { p_cohort: cohort.id, p_body: question.trim() });
    if (error) { onNotify?.(errText(error)); return; }
    setQuestion(""); onNotify?.("Question envoyée à ton formateur."); load();
  }

  async function addPortfolio(event) {
    event.preventDefault();
    if (pTitle.trim().length < 2) { onNotify?.("Donne un titre à ton travail."); return; }
    const { error } = await supabase.from("pc_portfolio_items").insert({ learner_id: user.id, title: pTitle.trim(), description: pDesc.trim(), attachments: pFiles });
    if (error) { onNotify?.(errText(error)); return; }
    setPTitle(""); setPDesc(""); setPFiles([]); onNotify?.("Ajouté à ton portfolio."); load();
  }

  if (cohort === undefined || (cohort && !data)) return <div className="pq"><p>Chargement de ton parcours…</p></div>;
  if (!cohort) return (
    <div className="pq account-content-card">
      <h3>Mon parcours</h3>
      <p>Tu n'es pas encore rattaché à une promotion. Dès que l'équipe t'affecte à une formation, tes exercices et tes notes apparaîtront ici.</p>
    </div>
  );

  const subBy = Object.fromEntries(data.subs.map((s) => [s.exercise_id, s]));
  const exById = Object.fromEntries(data.pc_exercises.map((e) => [e.id, e]));
  const graded = data.subs.filter((s) => s.grade != null && exById[s.exercise_id]);
  const validated = graded.filter((s) => (s.grade * 20) / exById[s.exercise_id].max_points >= 10);
  const badges = badgesFor({ eng: data.eng, subs: data.subs });
  const nextTodo = data.pc_exercises.filter((e) => !subBy[e.id] && e.due_at && new Date(e.due_at) > new Date()).slice(0, 3);

  return (
    <div className="pq">
      <div className="pq-head">
        <span className="eyebrow">MON PARCOURS</span>
        <h2>{cohort.name}</h2>
        <p>{cohort.course_title || "Formation"}</p>
      </div>
      <nav className="pq-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "pq-tab pq-tab-on" : "pq-tab"} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === "accueil" && (
        <div className="pq-grid">
          <div className="account-content-card pq-score">
            <span className={`pq-state ${STATE_CLASS[data.eng?.state] || ""}`}>{STATE_LABEL[data.eng?.state] || "—"}</span>
            <strong className="pq-big">{data.eng?.score ?? "—"}<small> / 100</small></strong>
            <p>Score d'engagement</p>
            <ul className="pq-metrics">
              <li>Rendus à temps : <b>{pct(data.eng?.on_time_rate)}</b></li>
              <li>Moyenne : <b>{data.eng?.avg_20 ?? "—"} / 20</b></li>
              <li>Présence : <b>{pct(data.eng?.attendance_rate)}</b></li>
            </ul>
          </div>
          <div className="account-content-card">
            <h3>Mes badges</h3>
            {badges.length === 0 && <p>Tes premiers badges arrivent avec tes premiers rendus.</p>}
            <div className="pq-badges">{badges.map((b) => <span key={b} className="pq-badge">{b}</span>)}</div>
          </div>
          <div className="account-content-card">
            <h3>À rendre bientôt</h3>
            {nextTodo.length === 0 && <p>Rien d'urgent pour le moment.</p>}
            {nextTodo.map((e) => (
              <button key={e.id} type="button" className="pq-row" onClick={() => { setTab("exercices"); setOpenId(e.id); }}>
                <strong>{e.title}</strong><small>Avant le {fmtDate(e.due_at)}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "exercices" && (
        <div className="pq-list">
          {data.pc_exercises.length === 0 && <p>Aucun exercice publié pour le moment.</p>}
          {data.pc_exercises.map((ex) => {
            const sub = subBy[ex.id];
            const st = gradeStatus(sub, ex);
            const open = openId === ex.id;
            return (
              <article key={ex.id} className="account-content-card">
                <button type="button" className="pq-ex-head" aria-expanded={open} onClick={() => setOpenId(open ? null : ex.id)}>
                  <span>
                    <strong>{ex.title}</strong>
                    <small>{ex.kind === "quiz" ? "Quiz" : "Travail"} · {ex.due_at ? `avant le ${fmtDate(ex.due_at)}` : "sans échéance"}</small>
                  </span>
                  <span className={`pq-st pq-st-${st.key}`}>{st.label}</span>
                </button>
                {open && (
                  <div className="pq-ex-body">
                    {ex.instructions && <p>{ex.instructions}</p>}
                    <AttachmentList items={ex.attachments} />
                    {sub && (
                      <div className="pq-answer">
                        <small>Ta réponse envoyée le {fmtDate(sub.submitted_at)}</small>
                        {sub.body && <p>{sub.body}</p>}
                        <AttachmentList items={sub.attachments} />
                        {sub.feedback && <p className="pq-feedback"><b>Commentaire du formateur :</b> {sub.feedback}</p>}
                      </div>
                    )}
                    {sub?.grade == null && ex.kind === "quiz" && <QuizForm ex={ex} onDone={load} onNotify={onNotify} />}
                    {sub?.grade == null && ex.kind !== "quiz" && <WorkForm ex={ex} user={user} onDone={load} onNotify={onNotify} />}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {tab === "modules" && (
        <div className="pq-list">
          {data.modules.length === 0 && <p>Les modules de ta formation apparaîtront ici.</p>}
          {data.modules.map((m) => {
            const width = m.total ? Math.round((100 * m.passed) / m.total) : 0;
            return (
              <div key={m.id} className="account-content-card pq-module">
                <div className="pq-mhead">
                  <strong>{m.position}. {m.title}</strong>
                  <span className={m.unlocked ? (m.completed ? "pq-st pq-st-graded" : "pq-st pq-st-sent") : "pq-st pq-st-todo"}>
                    {m.unlocked ? (m.completed ? "Terminé" : "Ouvert") : "🔒 Verrouillé"}
                  </span>
                </div>
                <div className="pq-bar"><span style={{ width: `${width}%` }} /></div>
                <small>{m.passed} / {m.total} exercice(s) validé(s) · moyenne minimale {fmtNum(m.pass_grade)} / 20</small>
                {!m.unlocked && <p className="pq-hint">Termine le module précédent pour le débloquer.</p>}
              </div>
            );
          })}
        </div>
      )}

      {tab === "notes" && (
        <div className="account-content-card">
          <h3>Mes notes</h3>
          {graded.length === 0 && <p>Aucune note pour le moment.</p>}
          {graded.map((s) => {
            const ex = exById[s.exercise_id];
            return (
              <div key={s.id} className="admin-row">
                <div><strong>{ex.title}</strong>{s.feedback && <p>{s.feedback}</p>}</div>
                <span className="pq-grade">{fmtNum(s.grade)} / {ex.max_points}</span>
              </div>
            );
          })}
          {graded.length > 0 && <p className="pq-avg">Moyenne : <b>{data.eng?.avg_20 ?? "—"} / 20</b></p>}
        </div>
      )}

      {tab === "presence" && (
        <div className="account-content-card">
          <h3>Ma présence</h3>
          {data.marks.length === 0 && <p>Aucune séance enregistrée pour le moment.</p>}
          {data.marks.map((m, i) => (
            <div key={i} className="admin-row">
              <div>
                <strong>{m.pc_attendance_sessions?.label}</strong>
                <small> · {fmtDay(m.pc_attendance_sessions?.session_date)} · {m.pc_attendance_sessions?.mode === "en_ligne" ? "en ligne" : "présentiel"}</small>
              </div>
              <span className={`pq-st ${m.status === "absent" ? "pq-st-todo" : "pq-st-sent"}`}>{ATT_LABEL[m.status]}</span>
            </div>
          ))}
          <p className="pq-avg">Taux de présence : <b>{pct(data.eng?.attendance_rate)}</b></p>
        </div>
      )}

      {tab === "questions" && (
        <div className="pq-list">
          <form className="account-content-card pq-form" onSubmit={ask}>
            <h3>Poser une question à ton formateur</h3>
            <textarea rows={3} maxLength={1000} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Écris ta question ici" />
            <button type="submit" className="button button-primary">Envoyer</button>
          </form>
          {data.questions.length === 0 && <p>Tu n'as pas encore posé de question.</p>}
          {data.questions.map((q) => (
            <div key={q.id} className="account-content-card">
              <small>{fmtDate(q.created_at)}</small>
              <p>{q.body}</p>
              {q.reply ? <p className="pq-feedback"><b>Réponse :</b> {q.reply}</p> : <p className="pq-hint">En attente de réponse.</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "portfolio" && (
        <div className="pq-list">
          <div className="account-content-card">
            <h3>Mon portfolio</h3>
            {validated.length === 0 && data.portfolio.length === 0 && <p>Tes travaux validés (moyenne d'au moins 10/20) apparaîtront ici.</p>}
            {validated.map((s) => (
              <div key={s.id} className="admin-row">
                <div><strong>{exById[s.exercise_id].title}</strong>{s.body && <p>{s.body}</p>}<AttachmentList items={s.attachments} /></div>
                <span className="pq-grade">{fmtNum(s.grade)} / {exById[s.exercise_id].max_points}</span>
              </div>
            ))}
            {data.portfolio.map((p) => (
              <div key={p.id} className="admin-row">
                <div><strong>{p.title}</strong>{p.description && <p>{p.description}</p>}<AttachmentList items={p.attachments} /></div>
              </div>
            ))}
          </div>
          <form className="account-content-card pq-form" onSubmit={addPortfolio}>
            <h3>Ajouter une réalisation</h3>
            <input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Titre (ex. Affiche pour un salon)" maxLength={120} />
            <textarea rows={2} value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Description (facultatif)" maxLength={500} />
            <AttachmentPicker user={user} value={pFiles} onChange={setPFiles} full max={4} onNotify={onNotify} />
            <button type="submit" className="button button-primary">Ajouter au portfolio</button>
          </form>
        </div>
      )}
    </div>
  );
}

function WorkForm({ ex, user, onDone, onNotify }) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    const { data: r, error } = await supabase.rpc("submit_work", { p_exercise: ex.id, p_body: body, p_attachments: files });
    setBusy(false);
    if (error) { onNotify?.(errText(error)); return; }
    onNotify?.(r?.late ? "Travail rendu (en retard)." : "Travail rendu ✓");
    onDone();
  }
  return (
    <div className="pq-form">
      <label>Ta réponse<textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écris ta réponse ici" maxLength={5000} /></label>
      <AttachmentPicker user={user} value={files} onChange={setFiles} full max={4} onNotify={onNotify} />
      <button type="button" className="button button-primary button-full" disabled={busy} onClick={send}>{busy ? "Envoi…" : "Rendre mon travail"}</button>
    </div>
  );
}

function QuizForm({ ex, onDone, onNotify }) {
  const qs = Array.isArray(ex.quiz) ? ex.quiz : [];
  const [answers, setAnswers] = useState(() => qs.map(() => null));
  async function send() {
    if (answers.some((a) => a === null)) { onNotify?.("Réponds à toutes les questions."); return; }
    const { data: r, error } = await supabase.rpc("submit_quiz", { p_exercise: ex.id, p_answers: answers });
    if (error) { onNotify?.(errText(error)); return; }
    onNotify?.(`Quiz noté : ${fmtNum(r?.grade)} / ${ex.max_points}`);
    onDone();
  }
  return (
    <div className="pq-form">
      {qs.map((q, i) => (
        <fieldset key={i} className="pq-q">
          <legend>{i + 1}. {q.q}</legend>
          {q.choices.map((c, j) => (
            <label key={j} className="pq-choice">
              <input type="radio" name={`q-${ex.id}-${i}`} checked={answers[i] === j} onChange={() => setAnswers((prev) => prev.map((a, k) => (k === i ? j : a)))} />
              {c}
            </label>
          ))}
        </fieldset>
      ))}
      <button type="button" className="button button-primary button-full" onClick={send}>Envoyer mes réponses</button>
    </div>
  );
}
