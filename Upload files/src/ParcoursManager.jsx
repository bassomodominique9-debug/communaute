import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AttachmentList, AttachmentPicker } from "./Attachments";
import { ATT_LABEL, STATE_CLASS, STATE_LABEL, errText, fmtDate, fmtDay, fmtNum, pct } from "./parcoursLib";
import "./parcours.css";

const TABS = [["suivi", "Suivi"], ["exercices", "Exercices"], ["presence", "Présence"], ["apprenants", "Apprenants"], ["questions", "Questions"]];
const today = () => new Date().toISOString().slice(0, 10);

export default function ParcoursManager({ user, role, onNotify }) {
  const [pc_cohorts, setCohorts] = useState([]);
  const [current, setCurrent] = useState(null);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [start, setStart] = useState(today);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("pc_cohorts").select("*").order("created_at", { ascending: false });
    if (error) onNotify?.(errText(error));
    else setCohorts(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(event) {
    event.preventDefault();
    const { error } = await supabase.from("pc_cohorts").insert({ name: name.trim(), course_title: course.trim(), starts_on: start });
    if (error) { onNotify?.(errText(error)); return; }
    setName(""); setCourse(""); onNotify?.("Promotion créée."); load();
  }

  if (current) return <CohortDetail cohort={current} role={role} user={user} onBack={() => { setCurrent(null); load(); }} onNotify={onNotify} />;

  return (
    <div className="pq pm">
      <div className="pq-head"><span className="eyebrow">PROMOTIONS</span><h2>Suivi des apprenants</h2></div>
      {role === "admin" && (
        <form className="account-content-card pm-form" onSubmit={create}>
          <h3>Nouvelle promotion</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom (ex. Promo Infographie – Octobre)" required maxLength={120} />
          <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Formation" maxLength={160} />
          <label>Date de début<input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <button type="submit" className="button button-primary">Créer la promotion</button>
        </form>
      )}
      <div className="account-content-card">
        <h3>Promotions</h3>
        {pc_cohorts.length === 0 && <p>Aucune promotion pour le moment.</p>}
        {pc_cohorts.map((c) => (
          <button key={c.id} type="button" className="pq-row" onClick={() => setCurrent(c)}>
            <strong>{c.name}</strong>
            <small>{c.course_title || "Formation"} · depuis le {fmtDay(c.starts_on)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function CohortDetail({ cohort, role, user, onBack, onNotify }) {
  const [tab, setTab] = useState("suivi");
  const [eng, setEng] = useState([]);
  const [pc_exercises, setExercises] = useState([]);
  const [modules, setModules] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [people, setPeople] = useState([]);
  const [report, setReport] = useState(null);
  const isAdmin = role === "admin";

  const load = useCallback(async () => {
    const cid = cohort.id;
    const res = await Promise.all([
      supabase.rpc("cohort_engagement", { p_cohort: cid }),
      supabase.from("pc_exercises").select("*").eq("cohort_id", cid).order("created_at", { ascending: false }),
      supabase.from("pc_course_modules").select("*").eq("cohort_id", cid).order("position", { ascending: true }),
      supabase.from("pc_cohort_members").select("user_id").eq("cohort_id", cid),
      supabase.from("pc_cohort_trainers").select("trainer_id").eq("cohort_id", cid),
      supabase.from("pc_attendance_sessions").select("*").eq("cohort_id", cid).order("session_date", { ascending: false }),
      supabase.from("pc_learner_questions").select("*").eq("cohort_id", cid).order("created_at", { ascending: false }),
    ]);
    const err = res.find((r) => r.error)?.error;
    if (err) onNotify?.(errText(err));
    setEng(Array.isArray(res[0].data) ? res[0].data : []);
    setExercises(res[1].data || []);
    setModules(res[2].data || []);
    setMembers((res[3].data || []).map((m) => m.user_id));
    setTrainers((res[4].data || []).map((t) => t.trainer_id));
    setSessions(res[5].data || []);
    setQuestions(res[6].data || []);
    if (isAdmin) {
      const p = await supabase.rpc("admin_list_users");
      if (!p.error && Array.isArray(p.data)) setPeople(p.data);
    }
  }, [cohort.id, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const nameOf = Object.fromEntries(eng.map((r) => [r.learner_id, r.full_name || "Membre"]));

  return (
    <div className="pq pm">
      <div className="pm-top"><button type="button" className="text-button" onClick={onBack}>← Promotions</button></div>
      <div className="pq-head"><span className="eyebrow">PROMOTION</span><h2>{cohort.name}</h2><p>{cohort.course_title || "Formation"}</p></div>
      <nav className="pq-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "pq-tab pq-tab-on" : "pq-tab"} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      {tab === "suivi" && <TrackingTab cohort={cohort} eng={eng} onChanged={load} onReport={setReport} onNotify={onNotify} />}
      {tab === "exercices" && <ExercisesTab cohort={cohort} user={user} pc_exercises={pc_exercises} modules={modules} nameOf={nameOf} onChanged={load} onNotify={onNotify} />}
      {tab === "presence" && <PresenceTab cohort={cohort} sessions={sessions} members={members} nameOf={nameOf} onChanged={load} onNotify={onNotify} />}
      {tab === "apprenants" && <MembersTab cohort={cohort} isAdmin={isAdmin} people={people} members={members} trainers={trainers} nameOf={nameOf} onChanged={load} onNotify={onNotify} />}
      {tab === "questions" && <QuestionsTab questions={questions} nameOf={nameOf} onChanged={load} onNotify={onNotify} />}
      {report && <ReportView row={report} cohort={cohort} pc_exercises={pc_exercises} onClose={() => setReport(null)} />}
    </div>
  );
}

function TrackingTab({ cohort, eng, onChanged, onReport, onNotify }) {
  const count = (s) => eng.filter((r) => r.state === s).length;
  const avg = eng.length ? Math.round(eng.reduce((a, r) => a + (r.score || 0), 0) / eng.length) : 0;

  async function refreshAlerts() {
    const { data, error } = await supabase.rpc("staff_refresh_alerts", { p_cohort: cohort.id });
    if (error) { onNotify?.(errText(error)); return; }
    onNotify?.(`${data?.alerts ?? 0} alerte(s) envoyée(s) aux formateurs.`);
    onChanged();
  }

  return (
    <>
      <div className="pm-kpis">
        <div><span>Apprenants</span><strong>{eng.length}</strong></div>
        <div><span>Engagement moyen</span><strong>{avg} / 100</strong></div>
        <div><span>Actifs</span><strong>{count("actif")}</strong></div>
        <div><span>À surveiller ou inactifs</span><strong>{count("a_surveiller") + count("inactif")}</strong></div>
      </div>
      <button type="button" className="button button-outline button-full" onClick={refreshAlerts}>Envoyer les alertes aux formateurs</button>
      {eng.length === 0 && <p>Aucun apprenant dans cette promotion pour le moment.</p>}
      {eng.length > 0 && (
        <div className="account-content-card pm-scroll">
          <table className="pm-table">
            <thead><tr><th>Apprenant</th><th>État</th><th>Score</th><th>À temps</th><th>Moyenne</th><th>Présence</th><th>Dernière activité</th><th></th></tr></thead>
            <tbody>
              {eng.map((r) => (
                <tr key={r.learner_id}>
                  <td>{r.full_name || "Membre"}</td>
                  <td><span className={`pq-state ${STATE_CLASS[r.state] || ""}`}>{STATE_LABEL[r.state] || "—"}</span></td>
                  <td>{r.score}</td>
                  <td>{pct(r.on_time_rate)}</td>
                  <td>{r.avg_20 ?? "—"}</td>
                  <td>{pct(r.attendance_rate)}</td>
                  <td>{fmtDate(r.last_activity)}</td>
                  <td><button type="button" className="button button-outline" onClick={() => onReport(r)}>Rapport</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ExercisesTab({ cohort, user, pc_exercises, modules, nameOf, onChanged, onNotify }) {
  return (
    <>
      <ModuleForm cohort={cohort} next={modules.length + 1} onNotify={onNotify} onDone={onChanged} />
      <ExerciseForm cohort={cohort} user={user} modules={modules} onNotify={onNotify} onDone={onChanged} />
      {pc_exercises.length === 0 && <p>Aucun exercice créé pour le moment.</p>}
      {pc_exercises.map((ex) => (
        <ExerciseRow key={ex.id} ex={ex} nameOf={nameOf} onChanged={onChanged} onNotify={onNotify} />
      ))}
    </>
  );
}

function ModuleForm({ cohort, next, onNotify, onDone }) {
  const [title, setTitle] = useState("");
  async function add(event) {
    event.preventDefault();
    const { error } = await supabase.from("pc_course_modules").insert({ cohort_id: cohort.id, title: title.trim(), position: next, pass_grade: 10 });
    if (error) { onNotify?.(errText(error)); return; }
    setTitle(""); onNotify?.("Module ajouté."); onDone();
  }
  return (
    <form className="account-content-card pm-form" onSubmit={add}>
      <h3>Ajouter un module</h3>
      <p>Chaque module se débloque quand le précédent est validé (moyenne d'au moins 10/20 sur ses exercices).</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du module" required maxLength={120} />
      <button type="submit" className="button button-outline">Ajouter le module</button>
    </form>
  );
}

const blankQuestion = () => ({ q: "", choices: ["", "", "", ""], correct: "0" });

function ExerciseForm({ cohort, user, modules, onNotify, onDone }) {
  const blank = { title: "", instructions: "", kind: "work", due: "", max: 20, moduleId: "", publish: false };
  const [f, setF] = useState(blank);
  const [files, setFiles] = useState([]);
  const [qs, setQs] = useState([blankQuestion()]);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function patchQ(i, patch) { setQs((prev) => prev.map((x, k) => (k === i ? { ...x, ...patch } : x))); }
  function patchChoice(i, j, v) { setQs((prev) => prev.map((x, k) => (k === i ? { ...x, choices: x.choices.map((c, m) => (m === j ? v : c)) } : x))); }

  async function save(event) {
    event.preventDefault();
    if (f.kind === "quiz" && qs.some((q) => !q.q.trim() || q.choices.some((c) => !c.trim()))) {
      onNotify?.("Chaque question doit avoir un intitulé et 4 réponses.");
      return;
    }
    setBusy(true);
    const { data: row, error } = await supabase.from("pc_exercises").insert({
      cohort_id: cohort.id,
      title: f.title.trim(),
      instructions: f.instructions.trim(),
      kind: f.kind,
      quiz: f.kind === "quiz" ? qs.map((q) => ({ q: q.q.trim(), choices: q.choices.map((c) => c.trim()) })) : [],
      attachments: files,
      due_at: f.due ? new Date(f.due).toISOString() : null,
      max_points: Number(f.max) || 20,
      module_id: f.moduleId || null,
      is_published: f.publish,
      created_by: user.id,
    }).select("id").single();
    if (error) { setBusy(false); onNotify?.(errText(error)); return; }
    if (f.kind === "quiz") {
      const { error: kErr } = await supabase.from("pc_exercise_keys").upsert({ exercise_id: row.id, answers: qs.map((q) => Number(q.correct)) });
      if (kErr) { setBusy(false); onNotify?.(errText(kErr)); return; }
    }
    setBusy(false);
    setF(blank); setFiles([]); setQs([blankQuestion()]);
    onNotify?.(f.publish ? "Exercice publié : les apprenants sont prévenus." : "Exercice enregistré (non publié).");
    onDone();
  }

  return (
    <form className="account-content-card pm-form" onSubmit={save}>
      <h3>Nouvel exercice</h3>
      <input value={f.title} onChange={set("title")} placeholder="Titre" required maxLength={160} />
      <textarea rows={3} value={f.instructions} onChange={set("instructions")} placeholder="Consigne" maxLength={3000} />
      <label>Type
        <select value={f.kind} onChange={set("kind")}>
          <option value="work">Travail à rendre (photo, document, lien, texte)</option>
          <option value="quiz">Quiz corrigé automatiquement</option>
        </select>
      </label>
      <label>Date limite<input type="datetime-local" value={f.due} onChange={set("due")} /></label>
      <label>Note maximale<input type="number" min="1" max="100" value={f.max} onChange={set("max")} /></label>
      <label>Module
        <select value={f.moduleId} onChange={set("moduleId")}>
          <option value="">Sans module</option>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.position}. {m.title}</option>)}
        </select>
      </label>
      <AttachmentPicker user={user} value={files} onChange={setFiles} full max={4} onNotify={onNotify} />
      {f.kind === "quiz" && (
        <div className="pm-form">
          {qs.map((q, i) => (
            <div key={i} className="pm-quiz-q">
              <input value={q.q} onChange={(e) => patchQ(i, { q: e.target.value })} placeholder={`Question ${i + 1}`} maxLength={300} />
              {q.choices.map((c, j) => (
                <label key={j} className="pq-choice">
                  <input type="radio" name={`correct-${i}`} checked={q.correct === String(j)} onChange={() => patchQ(i, { correct: String(j) })} />
                  <input value={c} onChange={(e) => patchChoice(i, j, e.target.value)} placeholder={`Réponse ${j + 1}`} maxLength={200} />
                </label>
              ))}
              <small>Coche la bonne réponse.</small>
            </div>
          ))}
          {qs.length < 10 && <button type="button" className="button button-outline" onClick={() => setQs((p) => [...p, blankQuestion()])}>+ Ajouter une question</button>}
        </div>
      )}
      <label className="admin-check"><input type="checkbox" checked={f.publish} onChange={(e) => setF((p) => ({ ...p, publish: e.target.checked }))} /> Publier maintenant (les apprenants reçoivent une notification)</label>
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer l'exercice"}</button>
    </form>
  );
}

function ExerciseRow({ ex, nameOf, onChanged, onNotify }) {
  const [open, setOpen] = useState(false);
  const [subs, setSubs] = useState([]);

  const loadSubs = useCallback(async () => {
    const { data, error } = await supabase.from("pc_submissions").select("*").eq("exercise_id", ex.id).order("submitted_at", { ascending: false });
    if (error) onNotify?.(errText(error));
    else setSubs(data || []);
  }, [ex.id]);

  useEffect(() => { if (open) loadSubs(); }, [open, loadSubs]);

  async function togglePublish() {
    const { error } = await supabase.from("pc_exercises").update({ is_published: !ex.is_published }).eq("id", ex.id);
    if (error) { onNotify?.(errText(error)); return; }
    onChanged();
  }

  return (
    <article className="account-content-card">
      <div className="pm-ex-head">
        <span>
          <strong>{ex.title}</strong>
          <small> · {ex.kind === "quiz" ? "Quiz" : "Travail"} · /{ex.max_points}{ex.due_at ? ` · avant le ${fmtDate(ex.due_at)}` : ""} · {ex.is_published ? "publié" : "brouillon"}</small>
        </span>
        <span className="pm-grade">
          <button type="button" className="button button-outline" onClick={togglePublish}>{ex.is_published ? "Retirer" : "Publier"}</button>
          <button type="button" className="button button-outline" onClick={() => setOpen(!open)}>{open ? "Fermer" : "Corriger"}</button>
        </span>
      </div>
      {open && (
        <div>
          {subs.length === 0 && <p>Aucun rendu pour le moment.</p>}
          {subs.map((s) => (
            <SubmissionGrade key={s.id} sub={s} ex={ex} name={nameOf[s.learner_id] || "Apprenant"} onDone={() => { loadSubs(); onChanged(); }} onNotify={onNotify} />
          ))}
        </div>
      )}
    </article>
  );
}

function SubmissionGrade({ sub, ex, name, onDone, onNotify }) {
  const [grade, setGrade] = useState(sub.grade ?? "");
  const [feedback, setFeedback] = useState(sub.feedback || "");
  async function save() {
    if (grade === "") { onNotify?.("Saisis une note."); return; }
    const { error } = await supabase.rpc("grade_submission", { p_submission: sub.id, p_grade: Number(grade), p_feedback: feedback.trim() || null });
    if (error) { onNotify?.(errText(error)); return; }
    onNotify?.("Note enregistrée. L'apprenant est prévenu.");
    onDone();
  }
  return (
    <div className="pm-sub">
      <div><strong>{name}</strong> <small>rendu le {fmtDate(sub.submitted_at)}</small></div>
      {sub.body && <p>{sub.body}</p>}
      <AttachmentList items={sub.attachments} />
      {ex.kind === "quiz" ? (
        <p><b>Note automatique :</b> {sub.grade != null ? `${fmtNum(sub.grade)} / ${ex.max_points}` : "—"}</p>
      ) : (
        <div className="pm-grade">
          <input type="number" min="0" max={ex.max_points} step="0.5" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="Note" />
          <span>/ {ex.max_points}</span>
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Commentaire pour l'apprenant" maxLength={2000} />
          <button type="button" className="button button-primary" onClick={save}>Noter</button>
        </div>
      )}
    </div>
  );
}

function PresenceTab({ cohort, sessions, members, nameOf, onChanged, onNotify }) {
  const [label, setLabel] = useState("");
  const [day, setDay] = useState(today);
  const [mode, setMode] = useState("presentiel");
  const [sel, setSel] = useState(null);
  const [marks, setMarks] = useState({});

  useEffect(() => {
    if (!sel) return;
    supabase.from("pc_attendance_marks").select("learner_id, status").eq("session_id", sel).then(({ data, error }) => {
      if (error) { onNotify?.(errText(error)); return; }
      setMarks(Object.fromEntries((data || []).map((m) => [m.learner_id, m.status])));
    });
  }, [sel]);

  async function addSession(event) {
    event.preventDefault();
    const { error } = await supabase.from("pc_attendance_sessions").insert({ cohort_id: cohort.id, session_date: day, label: label.trim() || "Séance", mode });
    if (error) { onNotify?.(errText(error)); return; }
    setLabel(""); onNotify?.("Séance créée."); onChanged();
  }

  async function mark(learnerId, status) {
    const { error } = await supabase.from("pc_attendance_marks").upsert({ session_id: sel, learner_id: learnerId, status }, { onConflict: "session_id,learner_id" });
    if (error) { onNotify?.(errText(error)); return; }
    setMarks((p) => ({ ...p, [learnerId]: status }));
    onChanged();
  }

  return (
    <>
      <form className="account-content-card pm-form" onSubmit={addSession}>
        <h3>Nouvelle séance</h3>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Intitulé (ex. Séance 3 : Canva)" maxLength={120} />
        <label>Date<input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></label>
        <label>Mode
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="presentiel">Présentiel</option>
            <option value="en_ligne">En ligne</option>
          </select>
        </label>
        <button type="submit" className="button button-primary">Créer la séance</button>
      </form>

      <div className="account-content-card">
        <h3>Séances</h3>
        {sessions.length === 0 && <p>Aucune séance pour le moment.</p>}
        {sessions.map((s) => (
          <button key={s.id} type="button" className={sel === s.id ? "pq-row pq-row-on" : "pq-row"} onClick={() => setSel(s.id)}>
            <strong>{s.label}</strong>
            <small>{fmtDay(s.session_date)} · {s.mode === "en_ligne" ? "en ligne" : "présentiel"}</small>
          </button>
        ))}
      </div>

      {sel && (
        <div className="account-content-card">
          <h3>Faire l'appel</h3>
          {members.length === 0 && <p>Aucun apprenant dans cette promotion.</p>}
          {members.map((id) => (
            <div key={id} className="admin-row">
              <strong>{nameOf[id] || "Apprenant"}</strong>
              <select value={marks[id] || ""} onChange={(e) => e.target.value && mark(id, e.target.value)} aria-label="Présence">
                <option value="">Non renseigné</option>
                {Object.entries(ATT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function MembersTab({ cohort, isAdmin, people, members, trainers, nameOf, onChanged, onNotify }) {
  if (!isAdmin) {
    return (
      <div className="account-content-card">
        <h3>Apprenants de la promotion</h3>
        {members.length === 0 && <p>Aucun apprenant.</p>}
        {members.map((id) => <div key={id} className="admin-row"><strong>{nameOf[id] || "Apprenant"}</strong></div>)}
      </div>
    );
  }
  async function toggle(fn, userId, add) {
    const { error } = await supabase.rpc(fn, { p_cohort: cohort.id, p_user: userId, p_add: add });
    if (error) { onNotify?.(errText(error)); return; }
    onChanged();
  }
  return (
    <div className="account-content-card">
      <h3>Apprenants et formateurs</h3>
      <p>Un membre ajouté comme apprenant reçoit une notification et accède à « Mon parcours ».</p>
      {people.map((p) => {
        const isL = members.includes(p.id);
        const isT = trainers.includes(p.id);
        return (
          <div key={p.id} className="admin-row">
            <div><strong>{p.full_name || "Membre"}</strong><p>{p.email}</p></div>
            <div className="admin-row-actions">
              <button type="button" className={isL ? "button button-danger" : "button button-outline"} onClick={() => toggle("admin_set_cohort_member", p.id, !isL)}>{isL ? "Retirer apprenant" : "Ajouter apprenant"}</button>
              <button type="button" className="button button-outline" onClick={() => toggle("admin_set_cohort_trainer", p.id, !isT)}>{isT ? "Retirer formateur" : "Nommer formateur"}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestionsTab({ questions, nameOf, onChanged, onNotify }) {
  const [drafts, setDrafts] = useState({});
  async function reply(id) {
    const text = (drafts[id] || "").trim();
    if (!text) return;
    const { error } = await supabase.rpc("answer_question", { p_question: id, p_reply: text });
    if (error) { onNotify?.(errText(error)); return; }
    setDrafts((p) => ({ ...p, [id]: "" }));
    onNotify?.("Réponse envoyée à l'apprenant.");
    onChanged();
  }
  return (
    <div className="account-content-card">
      <h3>Questions des apprenants</h3>
      {questions.length === 0 && <p>Aucune question pour le moment.</p>}
      {questions.map((q) => (
        <div key={q.id} className="pm-sub">
          <div><strong>{nameOf[q.learner_id] || "Apprenant"}</strong> <small>{fmtDate(q.created_at)}</small></div>
          <p>{q.body}</p>
          {q.reply ? (
            <p className="pq-feedback"><b>Ta réponse :</b> {q.reply}</p>
          ) : (
            <div className="pm-grade">
              <input placeholder="Ta réponse" value={drafts[q.id] || ""} onChange={(e) => setDrafts((p) => ({ ...p, [q.id]: e.target.value }))} maxLength={2000} />
              <button type="button" className="button button-primary" onClick={() => reply(q.id)}>Répondre</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReportView({ row, cohort, pc_exercises, onClose }) {
  const [subs, setSubs] = useState([]);
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    supabase.from("pc_submissions").select("*").eq("learner_id", row.learner_id).then(({ data }) => setSubs(data || []));
    supabase.from("pc_attendance_marks").select("status, pc_attendance_sessions!inner(session_date, label, cohort_id)").eq("learner_id", row.learner_id).eq("pc_attendance_sessions.cohort_id", cohort.id).then(({ data }) => setMarks(data || []));
  }, [row.learner_id, cohort.id]);

  return (
    <div className="pm-report-overlay" role="dialog" aria-modal="true" aria-label="Rapport de suivi">
      <div className="pm-report">
        <div className="no-print pm-report-actions">
          <button type="button" className="button button-primary" onClick={() => window.print()}>Imprimer / Enregistrer en PDF</button>
          <button type="button" className="button button-outline" onClick={onClose}>Fermer</button>
        </div>
        <h1>Rapport de suivi</h1>
        <p><b>{row.full_name}</b> · {cohort.name} · {cohort.course_title || "Formation"}</p>
        <p>Édité le {fmtDate(new Date().toISOString())}</p>
        <table className="pm-table">
          <tbody>
            <tr><th>Statut</th><td>{STATE_LABEL[row.state] || "—"}</td></tr>
            <tr><th>Score d'engagement</th><td>{row.score} / 100</td></tr>
            <tr><th>Rendus à temps</th><td>{pct(row.on_time_rate)}</td></tr>
            <tr><th>Moyenne</th><td>{row.avg_20 ?? "—"} / 20</td></tr>
            <tr><th>Présence</th><td>{pct(row.attendance_rate)} sur {row.sessions} séance(s)</td></tr>
            <tr><th>Dernière activité</th><td>{fmtDate(row.last_activity)}</td></tr>
          </tbody>
        </table>
        <h3>Travaux</h3>
        <table className="pm-table">
          <thead><tr><th>Exercice</th><th>Rendu</th><th>Note</th></tr></thead>
          <tbody>
            {pc_exercises.map((ex) => {
              const s = subs.find((x) => x.exercise_id === ex.id);
              return (
                <tr key={ex.id}>
                  <td>{ex.title}</td>
                  <td>{s ? fmtDate(s.submitted_at) : "Non rendu"}</td>
                  <td>{s && s.grade != null ? `${fmtNum(s.grade)} / ${ex.max_points}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <h3>Présence</h3>
        <table className="pm-table">
          <tbody>
            {marks.map((m, i) => (
              <tr key={i}><td>{m.pc_attendance_sessions?.label}</td><td>{fmtDay(m.pc_attendance_sessions?.session_date)}</td><td>{ATT_LABEL[m.status]}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="pm-sign">Document généré par ED B-CENTER.</p>
      </div>
    </div>
  );
}
