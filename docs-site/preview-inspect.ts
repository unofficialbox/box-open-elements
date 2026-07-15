/**
 * Walk a preview canvas (light DOM + nested shadow roots) to collect parts and
 * roles for the docs-site API / Accessibility / guidance panels.
 */

export interface PreviewInspection {
  parts: string[];
  /** Explicit `role` attributes only (what the Accessibility tab lists). */
  roles: string[];
  /**
   * Roles plus implied native interactive semantics used for guidance cards
   * when no explicit role is present.
   */
  guidanceRoles: string[];
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

  if (tag !== "input") {
    return;
  }

  const type = (node.getAttribute("type") ?? "text").toLowerCase();
  switch (type) {
    case "button":
    case "submit":
    case "reset":
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
    case "hidden":
    case "file":
    case "image":
      break;
    default:
      guidanceRoles.add("textbox");
      break;
  }
};

const walkRoot = (
  root: ParentNode,
  parts: Set<string>,
  roles: Set<string>,
  guidanceRoles: Set<string>,
): void => {
  const elements = root.querySelectorAll<HTMLElement>("*");
  for (const node of elements) {
    const partAttr = node.getAttribute("part");
    if (partAttr) {
      for (const part of partAttr.split(/\s+/)) {
        if (part) {
          parts.add(part);
        }
      }
    }

    const role = node.getAttribute("role");
    if (role) {
      roles.add(role);
      guidanceRoles.add(role);
    } else {
      addNativeGuidanceRole(node, guidanceRoles);
    }

    if (node.shadowRoot) {
      walkRoot(node.shadowRoot, parts, roles, guidanceRoles);
    }
  }
};

/** Inspect a mounted preview canvas, including nested custom-element shadows. */
export const inspectPreviewTree = (canvas: ParentNode): PreviewInspection => {
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
    if (canvas.shadowRoot) {
      walkRoot(canvas.shadowRoot, parts, roles, guidanceRoles);
    }
  }

  walkRoot(canvas, parts, roles, guidanceRoles);

  return {
    parts: [...parts].sort(),
    roles: [...roles].sort(),
    guidanceRoles: [...guidanceRoles].sort(),
  };
};
