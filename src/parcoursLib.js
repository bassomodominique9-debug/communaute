export const STATE_LABEL = { actif: "Actif", a_surveiller: "À surveiller", inactif: "Inactif" };
export const STATE_CLASS = { actif: "st-ok", a_surveiller: "st-warn", inactif: "st-off" };
export const ATT_LABEL = { present: "Présent", en_ligne: "En ligne", retard: "En retard", absent: "Absent" };

export const fmtDate = (d) => (d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
export const fmtDay = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—");
export const fmtNum = (x) => Number(x || 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
export const pct = (x) => (x == null ? "—" : `${Math.round(Number(x) * 100)} %`);

export const errText = (error) =>
  /function|schema cache|does not exist|relation/i.test(error?.message || "")
    ? "Le SQL « partie 16 » ou « partie 17 » n'est pas installé dans Supabase."
    : error?.message || "Une erreur est survenue.";

export function gradeStatus(sub, ex) {
  if (!sub) return { key: "todo", label: "À faire" };
  if (sub.grade != null) return { key: "graded", label: `Noté ${fmtNum(sub.grade)} / ${ex.max_points}` };
  const late = ex.due_at && new Date(sub.submitted_at) > new Date(ex.due_at);
  return late ? { key: "late", label: "Rendu en retard" } : { key: "sent", label: "Rendu" };
}

export function badgesFor({ eng, subs }) {
  const out = [];
  if (subs.length >= 1) out.push("🌱 Premier rendu");
  if (eng && eng.on_time_rate >= 0.9 && subs.length >= 3) out.push("⏱ Ponctuel");
  if (eng && eng.attendance_rate >= 0.9 && eng.sessions >= 3) out.push("📅 Assidu");
  if (eng && eng.avg_20 >= 16) out.push("🏅 Excellence");
  if (eng && eng.state === "actif") out.push("⭐ Membre actif");
  return out;
}
