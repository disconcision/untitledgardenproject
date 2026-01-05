import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // For GitHub Pages deployment:
  // - If GITHUB_PAGES is set, use the repo name as base path
  // - Otherwise use root (for local dev)
  // The repo name is extracted from GITHUB_REPOSITORY (e.g., "user/repo" -> "/repo/")
  base: process.env.GITHUB_ACTIONS
    ? `/${process.env.GITHUB_REPOSITORY?.split("/")[1] || ""}/`
    : "/",
});
