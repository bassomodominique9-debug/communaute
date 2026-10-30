import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import SplashScreen from "./SplashScreen.jsx";
import "./styles.css";
import "./design.css";
import "./compact.css";
import "./theme.css";
import "./app-shell.css";

// Évite l'icône d'image cassée si un fichier n'existe pas encore dans Supabase.
// L'image de secours est locale (SVG intégré), aucun service supplémentaire requis.
document.addEventListener("error", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLImageElement) || target.dataset.fallbackApplied === "true") return;
  target.dataset.fallbackApplied = "true";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="#eef4f5"/><g fill="none" stroke="#8aa5ad" stroke-width="10"><rect x="290" y="135" width="220" height="160" rx="18"/><circle cx="355" cy="185" r="18"/><path d="M310 270l65-58 43 38 34-26 38 46"/></g><text x="400" y="345" font-family="Arial,sans-serif" font-size="22" fill="#45616a" text-anchor="middle">ED BUSINESS CENTER</text></svg>`;
  target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  target.alt = target.alt || "Illustration ED BUSINESS CENTER indisponible";
}, true);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SplashScreen>
      <App />
    </SplashScreen>
  </React.StrictMode>
);
