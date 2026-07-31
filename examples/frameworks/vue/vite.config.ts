import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: tag => tag.startsWith("box-") },
      },
    }),
  ],
  build: {
    outDir: fileURLToPath(new URL("../../../.framework-validation/vue", import.meta.url)),
    emptyOutDir: true,
  },
});
