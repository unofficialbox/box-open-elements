import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [svelte()],
  build: {
    outDir: fileURLToPath(new URL("../../../.framework-validation/svelte", import.meta.url)),
    emptyOutDir: true,
  },
});
