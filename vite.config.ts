import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base must match the GitHub Pages project path: https://<user>.github.io/frauddesk/
export default defineConfig({
  base: "/frauddesk/",
  plugins: [react()],
});
