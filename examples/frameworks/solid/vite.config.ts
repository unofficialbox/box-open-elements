import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
export default defineConfig({ resolve: { dedupe: ["preact", "solid-js"] }, root: fileURLToPath(new URL(".", import.meta.url)), plugins: [solid({ ssr: true })], build: { outDir: fileURLToPath(new URL("../../../.framework-validation/solid", import.meta.url)), emptyOutDir: true } });
