import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 26 » dans Supabase." : e?.message || "Erreur");

export default function ModerationManager({ onNotify }) {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const u = await supabase.rpc("admin_list_users");
    if (u.error) onNotify?.(errMsg(u.error)); else setUsers(Array.isArray(u.data) ? u.data : []);
    const h = await supabase.rpc("staff_report_history");
    if (!h.error) setHistory(Array.isArray(h.data) ? h.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function block(userId, on) {
    const { error } = await supabase.rpc("admin_set_user_block", { p_user: userId, p_block: on });
    if (error) { onNotify?.(errMsg(error)); return; }
    onNotify?.(on ? "Compte bloqué." : "Compte débloqué.");
  }

  const shown = users.filter((u) => `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="account-content-card">
        <h3>Bloquer un membre</h3>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un nom ou un e-mail" />
        {shown.slice(0, 40).map((u) => (
          <div key={u.id} className="admin-row">
            <div><strong>{u.full_name || "Membre"}</strong><p>{u.email} · {u.role}</p></div>
            <div className="admin-row-actions">
              <button type="button" className="button button-danger" onClick={() => block(u.id, true)}>Bloquer</button>
              <button type="button" className="button button-outline" onClick={() => block(u.id, false)}>Débloquer</button>
            </div>
          </div>
        ))}
      </div>
      <div className="account-content-card">
        <h3>Historique des signalements</h3>
        {history.length === 0 && <p>Aucun signalement.</p>}
        {history.map((h) => (
          <div key={h.id} className="admin-row">
            <div><strong>{h.title || "Publication"}</strong><p>{h.reason} · {h.details || "—"}</p></div>
            <span className="pq-st">{h.status === "handled" ? "Traité" : "En attente"}</span>
          </div>
        ))}
      </div>
    </>
  );
}
