/**
 * Vite - Asset pipeline, tương tự Rails Webpacker/Vite.
 * Build với fingerprinting (hash) cho cache busting.
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  root: ".",
  build: {
    outDir: "app/assets/generated",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(configDir, "app/assets/javascripts/main.ts"),
      output: {
        entryFileNames: "bundle.js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
  resolve: {
    alias: {
      "@assets": path.resolve(configDir, "app/assets"),
    },
  },
});
