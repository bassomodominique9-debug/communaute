import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : facilite le déploiement GitHub Pages quel que soit le nom du dépôt.
  base: "./",
});
