import { useEffect, useState } from "react";
import "./splash.css";

// Animation d'ouverture : affichée une fois par session de navigation.
// Respecte la préférence « réduire les animations » du téléphone.
const SHOWN_KEY = "ed-bcenter-splash-shown";

function alreadyShown() {
  try { return sessionStorage.getItem(SHOWN_KEY) === "1"; } catch (e) { return false; }
}

export default function SplashScreen({ children }) {
  const [visible, setVisible] = useState(() => !alreadyShown());
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduce ? 500 : 2200;
    const leaveAt = total - 450;
    try { sessionStorage.setItem(SHOWN_KEY, "1"); } catch (e) { /* stockage indisponible : sans conséquence */ }
    const t1 = setTimeout(() => setLeaving(true), leaveAt);
    const t2 = setTimeout(() => setVisible(false), total);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      {visible && (
        <div className={`splash ${leaving ? "splash-leave" : ""}`} role="status" aria-label="Chargement de ED B-CENTER">
          <div className="splash-mark" aria-hidden="true">
            <span className="splash-bar splash-bar-1" />
            <span className="splash-bar splash-bar-2" />
            <span className="splash-bar splash-bar-3" />
            <span className="splash-arrow" />
          </div>
          <div className="splash-title">ED B-CENTER</div>
          <div className="splash-slogan">Apprendre, pratiquer, entreprendre !</div>
          <div className="splash-line"><span /></div>
        </div>
      )}
      {children}
    </>
  );
}
