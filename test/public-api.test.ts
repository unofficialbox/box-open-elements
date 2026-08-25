// @vitest-environment node

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  Accordion,
  Avatar,
  Button,
  Switch,
} from "../src/index.js";
import { Accordion as OptimizedAccordion } from "../src/entries/accordion.js";

describe("concise component API", () => {
  it("exports concise PascalCase classes from the root", () => {
    expect([Accordion.name, Avatar.name, Button.name, Switch.name]).toEqual([
      "Accordion",
      "Avatar",
      "Button",
      "Switch",
    ]);
    expect([Accordion.tagName, Avatar.tagName, Button.tagName, Switch.tagName]).toEqual([
      "box-accordion",
      "box-avatar",
      "box-button",
      "box-switch",
    ]);
  });

  it("maps optimized component entrypoints to the same classes", () => {
    expect(OptimizedAccordion).toBe(Accordion);
  });

  it("keeps imports and registration safe without browser globals", () => {
    expect(globalThis.customElements).toBeUndefined();
    expect(Accordion.register()).toBe(Accordion);
  });

  it("ships one optimized entrypoint for every component and pattern element", () => {
    const entries = readdirSync(join(import.meta.dirname, "../src/entries"))
      .filter(file => file.endsWith(".ts"));

    expect(entries).toHaveLength(142);
  });
});
