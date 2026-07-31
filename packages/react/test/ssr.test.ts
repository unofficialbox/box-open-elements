// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { Button, Dialog } from "../src/index.js";

describe("React adapter SSR", () => {
  it("imports without DOM globals and renders inert custom-element hosts", () => {
    expect(globalThis.HTMLElement).toBeUndefined();
    expect(globalThis.customElements).toBeUndefined();

    const html = renderToString(
      createElement(
        "section",
        null,
        createElement(Button, { label: "Save" }),
        createElement(Dialog, { open: false, heading: "Server dialog" }, "Body"),
      ),
    );

    expect(html).toContain("<box-button");
    expect(html).toContain("<box-dialog");
    expect(html).toContain("Body");
  });
});
