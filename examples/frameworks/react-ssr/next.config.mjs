import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  transpilePackages: ["@unofficialbox/box-open-elements-react"],
  turbopack: {
    root: fileURLToPath(new URL("../../..", import.meta.url)),
  },
};

export default nextConfig;
