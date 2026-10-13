import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import base from "./vite.config.js";
export default mergeConfig(base, { ssr: { noExternal: true }, build: { ssr: "src/server.tsx", outDir: fileURLToPath(new URL("../../../.framework-validation/solid-ssr", import.meta.url)) } });
