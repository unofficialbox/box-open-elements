// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { Dialog as DialogElement } from "../../../src/components/overlays/dialog.js";
import { Dialog } from "../src/dialog.js";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("Dialog React adapter", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("syncs controlled overlay properties and forwards the element ref", async () => {
    const ref = createRef<DialogElement>();

    await act(async () => {
      root.render(
        createElement(
          Dialog,
          {
            ref,
            open: true,
            heading: "Delete item",
            description: "This cannot be undone.",
            confirmLabel: "Delete",
            size: "large",
          },
          "Dialog body",
        ),
      );
      await Promise.resolve();
    });

    const element = container.querySelector("box-dialog") as DialogElement;
    expect(ref.current).toBe(element);
    expect(element.open).toBe(true);
    expect(element.heading).toBe("Delete item");
    expect(element.description).toBe("This cannot be undone.");
    expect(element.confirmLabel).toBe("Delete");
    expect(element.size).toBe("large");
    expect(element.textContent).toContain("Dialog body");
    expect(element.shadowRoot?.activeElement?.getAttribute("part")).toBe("dialog");
  });

  it("routes close events into React state and restores focus", async () => {
    const onCancel = vi.fn();

    const Harness = () => {
      const [open, setOpen] = useState(false);
      return createElement(
        "div",
        null,
        createElement("button", { type: "button", onClick: () => setOpen(true) }, "Open"),
        createElement(Dialog, {
          open,
          heading: "Controlled dialog",
          onCancel,
          onOpenChanged: event => setOpen(event.detail.open),
        }),
      );
    };

    act(() => root.render(createElement(Harness)));
    const opener = container.querySelector("button") as HTMLButtonElement;
    opener.focus();

    await act(async () => {
      opener.click();
      await Promise.resolve();
    });

    const element = container.querySelector("box-dialog") as DialogElement;
    expect(element.open).toBe(true);

    await act(async () => {
      const surface = element.shadowRoot?.querySelector('[part="dialog"]');
      surface?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(element.open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it("renders an SSR-safe custom-element host", () => {
    const html = renderToString(
      createElement(Dialog, { open: false, heading: "Server heading" }, "Server body"),
    );

    expect(html).toContain("<box-dialog");
    expect(html).toContain("Server body");
  });
});
