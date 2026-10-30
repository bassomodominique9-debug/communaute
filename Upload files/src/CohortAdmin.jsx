import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function CohortAdmin({ onNotify }) {
  const [cohorts, setCohorts] = useState([]);
  const [users, setUsers] = useState([]);
  const [f, setF] = useState({ name: "", course: "", trainer: "", starts: "" });
  const [pick, setPick] = useState({});
  const fail = (e) => onNotify?.(/function|schema cache/i.test(e.message) ? "Installe le SQL « partie 16 » dans Supabase." : e.message);
  const load = () => { supabase.rpc("trainer_cohorts").then(({ data, error }) => error ? fail(error) : setCohorts(data || [])); supabase.rpc("admin_list_users").then(({ data }) => setUsers(Array.isArray(data) ? data : [])); };
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    const { error } = await supabase.rpc("admin_create_cohort", { p_name: f.name.trim(), p_course: f.course.trim(), p_trainer: f.trainer || null, p_starts: f.starts || null });
    if (error) { fail(error); return; }
    onNotify?.("Promotion créée."); setF({ name: "", course: "", trainer: "", starts: "" }); load();
  }
  async function add(c) {
    if (!pick[c.id]) return;
    const { error } = await supabase.rpc("admin_add_cohort_member", { p_cohort: c.id, p_user: pick[c.id] });
    if (error) { fail(error); return; }
    onNotify?.("Apprenant ajouté : son espace est activé."); setPick({ ...pick, [c.id]: "" }); load();
  }
  const trainers = users.filter((u) => u.role === "trainer" || u.role === "admin");
  const learners = users.filter((u) => u.role !== "admin" && u.role !== "trainer");
  return (
    <div className="account-tab-content">
      <form className="account-content-card admin-form" onSubmit={create}>
        <h3>Nouvelle promotion</h3>
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nom (ex. Promotion Infographie 1)" required maxLength={80} />
        <input value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })} placeholder="Formation" maxLength={120} />
        <select value={f.trainer} onChange={(e) => setF({ ...f, trainer: e.target.value })}><option value="">Formateur (à choisir)</option>{trainers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}</select>
        <label>Début<input type="date" value={f.starts} onChange={(e) => setF({ ...f, starts: e.target.value })} /></label>
        <button type="submit" className="button button-primary">Créer la promotion</button>
      </form>
      {cohorts.map((c) => (
        <div className="account-content-card admin-form" key={c.id}>
          <h3>{c.name}</h3><p>{c.members} apprenant(s) · {c.pending} travail(aux) à corriger</p>
          <select value={pick[c.id] || ""} onChange={(e) => setPick({ ...pick, [c.id]: e.target.value })}><option value="">Ajouter un apprenant…</option>{learners.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}</select>
          <button type="button" className="button button-outline" onClick={() => add(c)}>Ajouter à la promotion</button>
        </div>
      ))}
    </div>
  );
}
