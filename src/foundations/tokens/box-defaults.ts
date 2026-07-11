import { registerDesignSystem } from "./registry.js";
import { boxIconography } from "../icons/box-iconography.js";
import type { DesignSystemDefinition } from "./types.js";

const iconSvg = (viewBox: string, body: string): string =>
  `<svg viewBox="${viewBox}" width="1em" height="1em" role="img" aria-hidden="true" focusable="false">${body}</svg>`;

const illustrationSvg = (viewBox: string, body: string): string =>
  `<svg viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="presentation" aria-hidden="true" focusable="false">${body}</svg>`;

export const boxDefaultDesignSystem: DesignSystemDefinition = {
  name: "box-default",
  tokens: {
    SurfaceSurface: "#ffffff",
    SurfaceSurfaceHover: "#f5f8fc",
    SurfaceSurfaceSecondary: "#f7f9fc",
    SurfaceSurfaceTertiary: "#edf2f7",
    SurfaceSurfaceQuaternary: "#d7e1ec",
    SurfaceSurfaceBrand: "#0061d5",
    SurfaceSurfaceBrandHover: "#006ae9",
    SurfaceSurfaceBrandPressed: "#004eac",
    SurfaceSearchSurface: "#f5f8fc",
    SurfaceItemSurfaceSelected: "#e8f1ff",
    SurfaceTooltipSurface: "#222a35",
    SurfaceStatusSurfaceSuccess: "#26c281",
    SurfaceStatusSurfaceError: "#ed3757",
    SurfaceStatusSurfaceInprogress: "#f5b31b",
    SurfaceIllustrationSurfaceBoxNeutral: "#0061d5",
    SurfaceBadgeFoldersharedSurface: "#2486fc",
    SurfaceBadgePdfSurface: "#d0021b",
    TextText: "#101820",
    TextTextSecondary: "#52606d",
    TextTextPlaceholder: "#748091",
    TextTextOnBrand: "#ffffff",
    StrokeStroke: "#d6e0ea",
    StrokeStrokeHover: "#bcc9d6",
  },
  icons: {
    ...boxIconography,
    info: iconSvg(
      "0 0 16 16",
      '<path fill="currentColor" d="M8.5 6.5H6.25a.75.75 0 0 0 0 1.5H7v4.5h-.75a.75.75 0 1 0 0 1.5H10a.75.75 0 1 0 0-1.5h-.75V7.41s.006-.217-.02-.327A.753.753 0 0 0 8.5 6.5ZM7.75 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />',
    ),
    alert: iconSvg(
      "0 0 16 16",
      '<path fill="currentColor" fill-rule="evenodd" d="M8 1.5a1.4 1.4 0 0 1 1.227.725l5.138 9.317A1.4 1.4 0 0 1 13.138 13.6H2.862a1.4 1.4 0 0 1-1.227-2.058l5.138-9.317A1.4 1.4 0 0 1 8 1.5Zm0 3.1a.75.75 0 0 0-.75.75v3.4a.75.75 0 0 0 1.5 0v-3.4A.75.75 0 0 0 8 4.6Zm0 6.4a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" clip-rule="evenodd" />',
    ),
    "folder-shared": iconSvg(
      "0 0 32 32",
      '<path fill="#2687FC" fill-rule="evenodd" d="M6 6h6c2 0 1.5 2 4 2h10a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z" clip-rule="evenodd" /><path fill="#91C2FD" fill-rule="evenodd" d="M26 11a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3h20Zm-6.999 8c-1.117 0-1.933.543-2.439 1.401.198.464.337.951.414 1.45.066.42.003.809-.165 1.138a1.7 1.7 0 0 0 .193.011h4.002l.14-.006c.63-.054.924-.476.844-.988a5.024 5.024 0 0 0-.258-.997c-.453-1.2-1.367-2.009-2.73-2.009h-.001ZM13 19c-1.364 0-2.278.81-2.731 2.01-.076.202-.137.41-.185.62-.028.123-.053.25-.073.378-.084.54.258.992.992.992h4.002l.14-.006c.63-.054.924-.476.843-.988a5.023 5.023 0 0 0-.257-.997C15.277 19.81 14.363 19 13 19Zm0-4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6.001 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" clip-rule="evenodd" />',
    ),
    "file-pdf": iconSvg(
      "0 0 32 32",
      '<path fill="#FFF" d="M6 4a3 3 0 0 1 3-3h9.757a2 2 0 0 1 1.415.586l5.242 5.242A2 2 0 0 1 26 8.243V25a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V4Z" /><path fill="#D0021B" d="M18 1v6a2 2 0 0 0 2 2h6v16a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3h9Z" opacity="0.12" /><path fill="#D0021B" d="M19 2.414 24.586 8H20a1 1 0 0 1-1-1V2.414Z" /><path fill="#D0021B" d="M9.8 23v-7h2.485c1.526 0 2.415.865 2.415 2.24 0 1.374-.889 2.248-2.415 2.248h-1.03V23H9.8Zm1.455-3.614h.83c.731 0 1.148-.387 1.148-1.146 0-.758-.417-1.137-1.148-1.137h-.83v2.283ZM15.975 23v-7h2.19c2.105 0 3.313 1.273 3.313 3.492 0 2.221-1.208 3.508-3.313 3.508h-2.19Zm1.455-1.22h.597c1.267 0 1.951-.728 1.951-2.288 0-1.557-.684-2.272-1.95-2.272h-.598v4.56ZM22.786 23v-7h4.475v1.22H24.24v1.675h2.796v1.188H24.24V23h-1.454Z" />',
    ),
  },
  illustrations: {
    "empty-state-folder": illustrationSvg(
      "0 0 140 140",
      '<g fill="var(--boe-token-surface-illustration-surface-box-neutral, #0061d5)" fill-rule="evenodd" clip-rule="evenodd" opacity="0.1"><path d="M47.11 36H35.383c-1.261 0-2.294.97-2.378 2.198L33 38.36v48.604c0 2.162 1.716 3.926 3.872 4.031l.546.005h.257l.19-.036c1.743-.375 3.062-1.86 3.152-3.663l.005-.197V73.972a.98.98 0 0 1 .017-.18.87.87 0 0 1-.032-.155L41 73.52V56.717c0-4.209 3.7-7.59 8.268-7.713l.26-.004L97 48.999v-2.26c0-3.08-2.463-5.592-5.546-5.707l-.221-.004H54.118a4.402 4.402 0 0 1-3.51-1.738l-.14-.197-1.375-2.042a2.386 2.386 0 0 0-1.8-1.044L47.11 36Z" /><path d="M51 96a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm47-66c5.523 0 10 4.477 10 10s-4.477 10-10 10-10-4.477-10-10 4.477-10 10-10Z" /></g><path fill="var(--boe-token-surface-illustration-surface-box-neutral, #0061d5)" fill-rule="evenodd" d="M95 90c0-7.18-5.82-13-13-13s-13 5.82-13 13 5.82 13 13 13 13-5.82 13-13Zm-12.268-6.723a1.03 1.03 0 0 0-1.269-.107l-.105.079-.061.057-.057.061-4.99 5.898-.074.098a1.06 1.06 0 0 0 .187 1.384l.098.076c.17.115.371.177.578.177H79l.001 4.921c0 .596.497 1.08 1.11 1.08h3.779c.614 0 1.11-.484 1.11-1.081V91h1.96l.115-.006c.52-.057.925-.503.925-1.045 0-.249-.087-.489-.246-.679l-4.932-5.898-.09-.095Z" clip-rule="evenodd" /><path fill="var(--boe-token-surface-illustration-surface-box-neutral, #0061d5)" d="M44.156 39c.466 0 .844.448.844 1s-.378 1-.844 1h-6.312c-.466 0-.844-.448-.844-1s.378-1 .844-1h6.312Zm41.952 21c.493 0 .892.448.892 1s-.4 1-.892 1H61.892c-.493 0-.892-.448-.892-1s.4-1 .892-1h24.216Z" /><path fill="var(--boe-token-surface-illustration-surface-box-neutral, #0061d5)" fill-rule="evenodd" d="M99 91a6 6 0 0 0 5.996-5.775L105 85l.005-28.283c0-2.983-2.745-5.672-6.005-5.708l-49.473-.019c-3.55 0-6.403 2.476-6.528 5.518l-.004.209c0 10.13.005 20.255.005 30.387a5.817 5.817 0 0 1-1.497 3.897L65 91a1 1 0 0 1 0 2H37c-3.238 0-5.878-2.521-5.996-5.675L31 87.104V38.347c0-2.33 1.85-4.232 4.174-4.342l.212-.005h11.727a4.4 4.4 0 0 1 3.509 1.739l.14.197 1.376 2.043c.407.607 1.073.99 1.799 1.045l.183.007h37.11c4.208 0 7.636 3.316 7.766 7.456l.004.244v2.284c4.358.24 7.863 3.449 7.996 7.464l.004.238V85a8 8 0 0 1-7.75 7.996L99 93a1 1 0 0 1 0-2ZM35.383 36H47.11l.183.007a2.386 2.386 0 0 1 1.8 1.044l1.375 2.042.14.197a4.402 4.402 0 0 0 3.51 1.738h37.115l.221.004c3.083.115 5.546 2.627 5.546 5.707v2.26L49.528 49l-.26.004C44.7 49.127 41 52.508 41 56.717c0 10.129.022 20.258.022 30.387l-.005.197c-.09 1.803-1.409 3.288-3.152 3.663l-.19.036h-.257l-.546-.005C34.716 90.89 33 89.126 33 86.964V38.36l.005-.162A2.374 2.374 0 0 1 35.383 36Z" clip-rule="evenodd" />',
    ),
    "files-information": illustrationSvg(
      "0 0 140 140",
      '<path fill="var(--boe-token-surface-illustration-surface-box-neutral, #0061d5)" fill-opacity="0.1" d="M97.5 99a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 1 1-5 0v-7a2.5 2.5 0 0 1 2.5-2.5ZM97.5 91a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM74 78a2 2 0 1 1 0 4H57a2 2 0 1 1 0-4h17ZM90.01 67a1.99 1.99 0 0 1 0 3.978H56.99a1.99 1.99 0 0 1 0-3.978h33.02ZM90 56a2 2 0 1 1 0 4H57a2 2 0 1 1 0-4h33ZM80.058 27c.61 0 1.202.206 1.671.595C83.773 29.286 87.784 32.783 92 37c4.641 4.641 8.41 8.877 9.859 10.81a.73.73 0 0 1-1.105.944L98.89 46.89a3.037 3.037 0 0 0-2.148-.89h-9.264A4.479 4.479 0 0 1 83 41.522v-8.743a4.479 4.479 0 0 0-1.22-3.073L79.226 27h.83Z" /><path fill="var(--boe-token-surface-illustration-surface-box-neutral, #0061d5)" fill-opacity="0.25" d="M45 91.001a8 8 0 0 0 8 8h28.068c-.044.494-.068.994-.068 1.499a16.42 16.42 0 0 0 2.966 9.439A7.896 7.896 0 0 1 83 110H43c-5.523 0-10-4.477-10-10V47a7 7 0 0 1 7-7h5v51.001Z" /><path fill="var(--boe-token-surface-illustration-surface-box-neutral, #0061d5)" fill-rule="evenodd" d="M97.5 98.25a3.25 3.25 0 0 1 3.25 3.25v7a3.25 3.25 0 1 1-6.5 0v-7a3.25 3.25 0 0 1 3.25-3.25Zm0 1.5a1.75 1.75 0 0 0-1.75 1.75v7a1.75 1.75 0 0 0 3.5 0v-7a1.75 1.75 0 0 0-1.75-1.75ZM97.5 90.25a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Zm0 1.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z" clip-rule="evenodd" /><path fill="var(--boe-token-surface-illustration-surface-box-neutral, #0061d5)" fill-rule="evenodd" d="M79.1 26.25a7.75 7.75 0 0 1 5.481 2.27l15.899 15.899a7.749 7.749 0 0 1 2.27 5.48v34.165c6.96 2.222 12 8.74 12 16.436 0 9.527-7.723 17.25-17.25 17.25-5.743 0-10.83-2.807-13.965-7.123-.5.08-1.013.123-1.535.123H42c-5.385 0-9.75-4.365-9.75-9.75V47A7.75 7.75 0 0 1 40 39.25h4.25V34A7.75 7.75 0 0 1 52 26.25h27.1Zm18.4 58.5c-8.698 0-15.75 7.052-15.75 15.75s7.052 15.75 15.75 15.75 15.75-7.052 15.75-15.75-7.052-15.75-15.75-15.75Zm-57.5-44A6.25 6.25 0 0 0 33.75 47v54a8.25 8.25 0 0 0 8.25 8.25h40c.207 0 .413-.011.616-.026a17.172 17.172 0 0 1-2.348-9.473H52a7.75 7.75 0 0 1-7.75-7.75V40.75H40Zm12-13A6.25 6.25 0 0 0 45.75 34v58.001a6.25 6.25 0 0 0 6.25 6.25h28.395c1.103-8.464 8.34-15.001 17.105-15.001 1.288 0 2.543.141 3.75.41V51.112c0-.514-.204-1.007-.567-1.37l-1.902-1.901a3.73 3.73 0 0 0-2.637-1.092h-8.666a5.229 5.229 0 0 1-5.228-5.228v-8.743c0-.951-.364-1.866-1.017-2.558l-1.756-1.864a1.938 1.938 0 0 0-1.41-.607H52Zm30.325 1.441a5.23 5.23 0 0 1 1.425 3.588v8.742c0 2.06 1.67 3.729 3.728 3.729h8.666a5.23 5.23 0 0 1 3.698 1.531l1.056 1.057a6.241 6.241 0 0 0-1.48-2.358L83.52 29.581a6.252 6.252 0 0 0-2.15-1.403l.956 1.013Z" clip-rule="evenodd" />',
    ),
  },
};

export const registerBoxDefaultDesignSystem = (
  options: { setActive?: boolean } = {},
): DesignSystemDefinition =>
  registerDesignSystem(boxDefaultDesignSystem, options);
