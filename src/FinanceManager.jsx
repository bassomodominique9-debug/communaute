import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 25 » dans Supabase." : e?.message || "Erreur");
const fcfa = (n) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`;

export default function FinanceManager({ onNotify }) {
  const [sum, setSum] = useState(null);
  const [regs, setRegs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ kind: "service", amount: "", note: "" });

  const load = useCallback(async () => {
    const s = await supabase.rpc("finance_summary");
    if (s.error) onNotify?.(errMsg(s.error)); else setSum(s.data);
    const r = await supabase.from("course_registrations").select("id, full_name, course_title, amount_xaf, payment_status, is_test").order("created_at", { ascending: false }).limit(40);
    if (!r.error) setRegs(r.data || []);
    const j = await supabase.rpc("admin_list_jobs");
    if (!j.error && j.data) setOffers(j.data.offers || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(event) {
    event.preventDefault();
    const { error } = await supabase.rpc("admin_add_entry", { p_kind: form.kind, p_amount: Number(form.amount), p_note: form.note });
    if (error) { onNotify?.(errMsg(error)); return; }
    setForm({ kind: "service", amount: "", note: "" }); onNotify?.("Écriture ajoutée."); load();
  }

  async function removeEntry(id) {
    const { error } = await supabase.rpc("admin_delete_entry", { p_id: id });
    if (error) onNotify?.(errMsg(error)); else load();
  }

  async function toggleTest(table, id, current) {
    const { error } = await supabase.rpc("admin_set_test", { p_table: table, p_id: id, p_test: !current });
    if (error) onNotify?.(errMsg(error)); else load();
  }

  async function purge() {
    if (!window.confirm("Effacer toutes les données marquées « test » ? Cette action est définitive.")) return;
    const { data, error } = await supabase.rpc("admin_purge_test_data");
    if (error) { onNotify?.(errMsg(error)); return; }
    onNotify?.(`Données test effacées : ${data.courses} inscription(s), ${data.tickets} ticket(s), ${data.jobs} offre(s).`);
    load();
  }

  const total = sum ? sum.employer + sum.workshop + sum.course + sum.service : 0;

  return (
    <>
      <div className="pm-kpis">
        <div><span>Employeurs</span><strong>{fcfa(sum?.employer)}</strong></div>
        <div><span>Ateliers</span><strong>{fcfa(sum?.workshop)}</strong></div>
        <div><span>Formations</span><strong>{fcfa(sum?.course)}</strong></div>
        <div><span>Services</span><strong>{fcfa(sum?.service)}</strong></div>
      </div>
      <div className="account-content-card"><b>Total encaissé (hors test) : {fcfa(total)}</b><p>Écritures test exclues : {sum?.test_entries ?? 0}</p></div>

      <form className="account-content-card admin-form" onSubmit={add}>
        <h3>Ajouter une écriture</h3>
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
          <option value="service">Vente de service</option>
          <option value="adjust">Ajustement du solde des inscriptions</option>
        </select>
        <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Montant (FCFA, négatif pour retirer)" required />
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Motif" maxLength={200} />
        <button type="submit" className="button button-primary">Enregistrer</button>
      </form>

      <div className="account-content-card">
        <h3>Écritures manuelles</h3>
        {(sum?.manual || []).length === 0 && <p>Aucune écriture manuelle.</p>}
        {(sum?.manual || []).map((m) => (
          <div key={m.id} className="admin-row">
            <div><strong>{fcfa(m.amount)}</strong><p>{m.kind} · {m.note}</p></div>
            <button type="button" className="button button-outline" onClick={() => removeEntry(m.id)}>Supprimer</button>
          </div>
        ))}
      </div>

      <div className="account-content-card">
        <h3>Marquer les tests</h3>
        <p>Les paiements marqués « test » n'entrent pas dans les soldes.</p>
        {regs.map((r) => (
          <div key={r.id} className="admin-row">
            <div><strong>{r.full_name}</strong><p>{r.course_title} · {fcfa(r.amount_xaf)} · {r.payment_status}</p></div>
            <button type="button" className={r.is_test ? "button button-danger" : "button button-outline"} onClick={() => toggleTest("course_registrations", r.id, r.is_test)}>{r.is_test ? "Test" : "Marquer test"}</button>
          </div>
        ))}
        {offers.map((o) => (
          <div key={o.id} className="admin-row">
            <div><strong>{o.title}</strong><p>Employeur · {o.status} · {fcfa(o.amount)}</p></div>
            <button type="button" className={o.is_test ? "button button-danger" : "button button-outline"} onClick={() => toggleTest("job_offers", o.id, o.is_test)}>{o.is_test ? "Test" : "Marquer test"}</button>
          </div>
        ))}
        <button type="button" className="button button-danger button-full" onClick={purge}>Effacer les données test</button>
      </div>
    </>
  );
}
