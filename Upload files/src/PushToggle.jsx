import { useEffect, useState } from "react";
import { enablePush, pushSupported } from "./push";

export default function PushToggle({ onNotify }) {
  const [state, setState] = useState("idle");

  useEffect(() => {
    if (!pushSupported()) { setState("unsupported"); return; }
    if (Notification.permission === "granted") {
      navigator.serviceWorker.getRegistration().then((r) => r && r.pushManager.getSubscription()).then((s) => setState(s ? "on" : "idle")).catch(() => {});
    }
  }, []);

  async function activate() {
    setState("busy");
    try { await enablePush(); setState("on"); onNotify?.("Notifications sonores activées sur cet appareil."); }
    catch (error) { setState("idle"); onNotify?.(error.message); }
  }

  if (state === "unsupported") return <p className="push-note">Pour recevoir les notifications avec le son du téléphone, ouvre l'application avec Chrome sur Android.</p>;
  if (state === "on") return <p className="push-note push-on">✓ Son des notifications activé sur cet appareil</p>;
  return <button type="button" className="button button-primary push-button" disabled={state === "busy"} onClick={activate}>{state === "busy" ? "Activation…" : "Activer le son des notifications"}</button>;
}
