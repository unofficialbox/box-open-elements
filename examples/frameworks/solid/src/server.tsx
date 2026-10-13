import { generateHydrationScript, renderToString } from "solid-js/web";
import { App } from "./app.js";
export const html = renderToString(() => <App />);
export const openHtml = renderToString(() => <App initialOpen />);
export const hydrationScript = generateHydrationScript();
if (typeof globalThis.HTMLElement !== "undefined") throw new Error("SSR fixture requires no DOM");
if (!html.includes("box-text-field") || !html.includes("Footer slot") || html.includes("[object Object]")) throw new Error("SSR host contract failed");
console.log("solid SSR passed");
