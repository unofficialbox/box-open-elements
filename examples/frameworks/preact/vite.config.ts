import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
export default defineConfig({ resolve: { dedupe: ["preact", "solid-js"] }, root: fileURLToPath(new URL(".", import.meta.url)), build: { outDir: fileURLToPath(new URL("../../../.framework-validation/preact", import.meta.url)), emptyOutDir: true } });
