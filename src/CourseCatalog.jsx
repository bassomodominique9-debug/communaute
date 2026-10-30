import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export function mergeCatalog(base, rows) {
  const byId = Object.fromEntries((rows || []).map((r) => [r.id, r]));
  const out = base
    .filter((c) => !byId[c.id] || byId[c.id].is_published)
    .map((c) => {
      const o = byId[c.id];
      if (!o) return c;
      return {
        ...c,
        title: o.title || c.title,
        category: o.category || c.category,
        duration: o.duration || c.duration,
        description: o.description || c.description,
        skills: o.skills?.length ? o.skills : c.skills,
        image: o.image_name || c.image,
        price: o.price_xaf ?? c.price,
        oldPrice: o.old_price_xaf ?? c.oldPrice,
      };
    });
  (rows || []).forEach((r) => {
    if (!base.some((c) => c.id === r.id) && r.is_published) {
      out.push({ id: r.id, title: r.title, category: r.category, duration: r.duration, description: r.description,
        skills: r.skills || [], image: r.image_name, price: r.price_xaf ?? 0, oldPrice: r.old_price_xaf ?? null });
    }
  });
  return out;
}

export function useCourseCatalog(base) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    supabase.from("catalog_courses").select("*").then(({ data, error }) => { if (!error && Array.isArray(data)) setRows(data); });
  }, []);
  return mergeCatalog(base, rows);
}
