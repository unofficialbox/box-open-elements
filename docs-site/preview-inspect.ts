/**
 * Walk a preview canvas (light DOM + nested shadow roots) to collect parts and
 * roles for the docs-site API / Accessibility / guidance panels.
 */

export interface PreviewInspection {
  /**
   * `part` names from the primary host's own shadow tree only. Nested
   * custom-element parts are omitted — they are not selectable as
   * `host::part(...)` unless forwarded via `exportparts`.
   */
  parts: string[];
  /** Explicit `role` attributes only (what the Accessibility tab lists). */
  roles: string[];
  /**
   * Roles plus implied native interactive semantics used for guidance cards
   * when no explicit role is present.
   */
  guidanceRoles: string[];
}

export interface InspectPreviewOptions {
  /** Tag name of the catalog surface; parts are collected only from its shadow. */
  primaryTag: string;
}

const addNativeGuidanceRole = (node: Element, guidanceRoles: Set<string>): void => {
  if (node.getAttribute("role")) {
    return;
  }

  const tag = node.tagName.toLowerCase();
  if (tag === "button") {
    guidanceRoles.add("button");
    return;
  }

  if (tag === "textarea") {
    guidanceRoles.add("textbox");
    return;
  }

  if (tag === "select") {
    const multiple = node.hasAttribute("multiple");
    const size = Number.parseInt(node.getAttribute("size") ?? "0", 10);
    guidanceRoles.add(multiple || (Number.isFinite(size) && size > 1) ? "listbox" : "combobox");
    return;
  }

  if (tag === "a" && node.hasAttribute("href")) {
    guidanceRoles.add("link");
    return;
  }

  if (tag !== "input") {
    return;
  }

  const type = (node.getAttribute("type") ?? "text").toLowerCase();
  switch (type) {
    case "button":
    case "submit":
    case "reset":
    case "image":
      guidanceRoles.add("button");
      break;
    case "checkbox":
      guidanceRoles.add("checkbox");
      break;
    case "radio":
      guidanceRoles.add("radio");
      break;
    case "search":
      guidanceRoles.add("searchbox");
      break;
    case "number":
      guidanceRoles.add("spinbutton");
      break;
    case "range":
      guidanceRoles.add("slider");
      break;
    case "hidden":
    case "file":
      break;
    default:
      guidanceRoles.add("textbox");
      break;
  }
};

const collectPartsFromShadow = (root: ParentNode, parts: Set<string>): void => {
  for (const node of root.querySelectorAll<HTMLElement>("[part]")) {
    const partAttr = node.getAttribute("part");
    if (!partAttr) {
      continue;
    }
    for (const part of partAttr.split(/\s+/)) {
      if (part) {
        parts.add(part);
      }
    }
  }
};

const walkRoles = (root: ParentNode, roles: Set<string>, guidanceRoles: Set<string>): void => {
  for (const node of root.querySelectorAll<HTMLElement>("*")) {
    const role = node.getAttribute("role");
    if (role) {
      roles.add(role);
      guidanceRoles.add(role);
    } else {
      addNativeGuidanceRole(node, guidanceRoles);
    }

    if (node.shadowRoot) {
      walkRoles(node.shadowRoot, roles, guidanceRoles);
    }
  }
};

/** Inspect a mounted preview canvas, including nested custom-element shadows. */
export const inspectPreviewTree = (
  canvas: ParentNode,
  options: InspectPreviewOptions,
): PreviewInspection => {
  const parts = new Set<string>();
  const roles = new Set<string>();
  const guidanceRoles = new Set<string>();

  if (canvas instanceof Element) {
    const hostRole = canvas.getAttribute("role");
    if (hostRole) {
      roles.add(hostRole);
      guidanceRoles.add(hostRole);
    } else {
      addNativeGuidanceRole(canvas, guidanceRoles);
    }
  }

  walkRoles(canvas, roles, guidanceRoles);

  const primaryTag = options.primaryTag.toLowerCase();
  const primary =
    canvas instanceof Element && canvas.tagName.toLowerCase() === primaryTag
      ? canvas
      : canvas.querySelector<HTMLElement>(primaryTag);
  if (primary?.shadowRoot) {
    collectPartsFromShadow(primary.shadowRoot, parts);
  }

  return {
    parts: [...parts].sort(),
    roles: [...roles].sort(),
    guidanceRoles: [...guidanceRoles].sort(),
  };
};
