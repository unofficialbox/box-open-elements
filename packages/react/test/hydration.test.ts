// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { Button } from "../src/button.js";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("React adapter hydration", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    vi.restoreAllMocks();
  });

  it("hydrates an SSR custom-element host without a mismatch", async () => {
    const onClick = vi.fn();
    const serverHtml = renderToString(createElement(Button, { label: "Save" }));
    container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.append(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => {
      root = hydrateRoot(container!, createElement(Button, { label: "Save", onClick }));
      await Promise.resolve();
    });

    const element = container.querySelector("box-button");
    expect(element?.shadowRoot?.querySelector("button")?.textContent).toContain("Save");
    expect(consoleError).not.toHaveBeenCalled();

    act(() => element?.shadowRoot?.querySelector("button")?.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
