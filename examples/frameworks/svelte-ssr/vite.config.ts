import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [svelte()],
  ssr: {
    noExternal: ["@unofficialbox/box-open-elements-svelte"],
  },
  build: {
    ssr: "entry.ts",
    outDir: fileURLToPath(new URL("../../../.framework-validation/svelte-ssr", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      output: { entryFileNames: "entry.js" },
    },
  },
});
