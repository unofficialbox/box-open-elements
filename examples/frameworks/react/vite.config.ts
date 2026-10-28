import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { localCoreAliases } from "../local-core";

export default defineConfig({
  resolve: { alias: localCoreAliases },
  root: fileURLToPath(new URL(".", import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL("../../../.framework-validation/react", import.meta.url)),
    emptyOutDir: true,
  },
});
