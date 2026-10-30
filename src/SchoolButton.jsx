import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function SchoolButton({ onOpen }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    supabase.rpc("my_school_access").then(({ data, error }) => { if (!error && data === true) setOk(true); });
  }, []);
  if (!ok) return null;
  return <button type="button" className="button button-primary school-button" onClick={onOpen}>🎓 School</button>;
}
