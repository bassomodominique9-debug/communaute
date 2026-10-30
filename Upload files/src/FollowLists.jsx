import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AuthorAvatar, AuthorBadge } from "./AuthorBadge";

export default function FollowLists({ onNotify }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("followers");

  useEffect(() => {
    supabase.rpc("get_my_follows").then(({ data: d, error }) => {
      if (error) onNotify?.(/function|schema cache/i.test(error.message) ? "Installe le SQL « partie 11 » dans Supabase." : error.message);
      else setData(d);
    });
  }, []);

  const list = data?.[tab] || [];
  return (
    <div className="account-content-card">
      <div className="admin-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "followers"} className={tab === "followers" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => setTab("followers")}>Abonnés ({data?.followers?.length ?? 0})</button>
        <button type="button" role="tab" aria-selected={tab === "following"} className={tab === "following" ? "admin-tab admin-tab-active" : "admin-tab"} onClick={() => setTab("following")}>Abonnements ({data?.following?.length ?? 0})</button>
      </div>
      {!data && <p>Chargement…</p>}
      {data && list.length === 0 && <p>{tab === "followers" ? "Personne ne t'est encore abonné." : "Tu ne suis personne pour le moment."}</p>}
      {list.map((card) => (
        <div className="admin-row follow-row" key={card.id} role="button" tabIndex={0} onClick={() => window.dispatchEvent(new CustomEvent("ed-open-profile", { detail: card.id }))}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AuthorAvatar card={card} />
            <div><strong>{card.full_name}</strong><AuthorBadge card={card} /><p>{card.points} points</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
