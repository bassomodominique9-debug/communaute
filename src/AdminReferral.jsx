import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const fmt = (n) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`;
const errMsg = (e) => (/function|schema cache|does not exist/i.test(e?.message || "") ? "Installe le SQL « partie 28 » dans Supabase." : e?.message || "Erreur");

export default function AdminReferral({ onNotify }) {
  const [ov, setOv] = useState(null);
  const [edit, setEdit] = useState({});

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_referral_overview");
    if (error) { onNotify?.(errMsg(error)); return; }
    setOv(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function saveSetting(key) {
    const v = edit[key];
    if (v === undefined || v === "") return;
    const { error } = await supabase.rpc("admin_set_referral_setting", { p_key: key, p_value: Number(v) });
    if (error) { onNotify?.(errMsg(error)); return; }
    onNotify?.("Réglage enregistré."); setEdit({ ...edit, [key]: "" }); load();
  }
  async function act(fn, args, ok) {
    const { error } = await supabase.rpc(fn, args);
    if (error) { onNotify?.(errMsg(error)); return; }
    onNotify?.(ok); load();
  }

  if (!ov) return <p>Chargement du parrainage…</p>;
  return (
    <>
      <div className="pm-kpis">
        <div><span>Récompenses validées</span><strong>{fmt(ov.validated_total)}</strong></div>
        <div><span>En attente</span><strong>{fmt(ov.pending_total)}</strong></div>
        <div><span>Retraits payés ou approuvés</span><strong>{fmt(ov.withdrawn_total)}</strong></div>
      </div>

      <div className="account-content-card">
        <h3>Réglages du parrainage</h3>
        {ov.settings.map((s) => (
          <div key={s.key} className="admin-row">
            <div><strong>{s.label}</strong><p>Actuel : {s.value}</p></div>
            <div className="admin-row-actions">
              <input type="number" min="0" value={edit[s.key] ?? ""} placeholder={String(s.value)} onChange={(e) => setEdit({ ...edit, [s.key]: e.target.value })} />
              <button type="button" className="button button-outline" onClick={() => saveSetting(s.key)}>Enregistrer</button>
            </div>
          </div>
        ))}
        <button type="button" className="button button-outline button-full" onClick={() => {
          if (window.confirm("Rattacher tous les comptes existants à ton code ? Cette action ne peut être faite qu'une fois.")) act("admin_attach_legacy", {}, "Comptes existants rattachés.");
        }}>Rattacher les comptes existants à mon code</button>
      </div>

      <div className="account-content-card">
        <h3>Retraits</h3>
        {ov.withdrawals.length === 0 && <p>Aucune demande.</p>}
        {ov.withdrawals.map((w) => (
          <div key={w.id} className="admin-row">
            <div><strong>{w.name}</strong><p>{w.phone} · {fmt(w.amount)} · {w.status}</p></div>
            <div className="admin-row-actions">
              {w.status === "requested" && <button type="button" className="button button-outline" onClick={() => act("admin_process_withdrawal", { p_id: w.id, p_action: "approve" }, "Retrait approuvé.")}>Approuver</button>}
              {(w.status === "requested" || w.status === "approved") && <button type="button" className="button button-primary" onClick={() => act("admin_process_withdrawal", { p_id: w.id, p_action: "paid" }, "Retrait marqué payé.")}>Payé</button>}
              {(w.status === "requested" || w.status === "approved") && <button type="button" className="button button-danger" onClick={() => act("admin_process_withdrawal", { p_id: w.id, p_action: "reject" }, "Retrait refusé.")}>Refuser</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="account-content-card">
        <h3>Renouvellements de codes</h3>
        {ov.renewals.length === 0 && <p>Aucun renouvellement.</p>}
        {ov.renewals.map((r) => (
          <div key={r.id} className="admin-row">
            <div><strong>{fmt(r.amount)}</strong><p>{r.status} · ID {r.tx || "—"}</p>{r.proof && <a href={r.proof} target="_blank" rel="noopener noreferrer">Voir la preuve</a>}</div>
            {r.status === "pending" && (
              <div className="admin-row-actions">
                <button type="button" className="button button-primary" onClick={() => act("admin_confirm_renewal", { p_id: r.id, p_ok: true }, "Renouvellement confirmé.")}>Confirmer</button>
                <button type="button" className="button button-danger" onClick={() => act("admin_confirm_renewal", { p_id: r.id, p_ok: false }, "Renouvellement refusé.")}>Refuser</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="account-content-card">
        <h3>Soldes par parrain</h3>
        {ov.balances.map((b) => (
          <div key={b.user_id} className="admin-row"><div><strong>{b.name || "Membre"}</strong><p>{b.attributed} compte(s)</p></div><b>{fmt(b.available)}</b></div>
        ))}
      </div>
    </>
  );
}
