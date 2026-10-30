import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import FollowLists from "./FollowLists";
import "./lot5.css";

export default function FollowCounts({ onNotify }) {
  const [counts, setCounts] = useState(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_my_follows");
    if (error) return;
    setCounts({ followers: (data?.followers || []).length, following: (data?.following || []).length });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="follow-counts">
      <button type="button" onClick={() => setOpen(true)}><b>{counts?.followers ?? "–"}</b> abonnés</button>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={() => setOpen(true)}><b>{counts?.following ?? "–"}</b> abonnements</button>
      {open && (
        <div className="modal-backdrop" role="presentation">
          <div className="auth-modal follow-modal" role="dialog" aria-modal="true" aria-label="Mon réseau">
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            <h2>Mon réseau</h2>
            <FollowLists onNotify={onNotify} />
          </div>
        </div>
      )}
    </div>
  );
}
