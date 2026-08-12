import { afterEach, describe, expect, it, vi } from "vitest";

import { createContentPreviewAdapter } from "../../../src/patterns/preview/content-preview-adapter.js";
import {
  createStaticPreviewProviderAdapter,
  resolvePreviewStatus,
} from "../../../src/patterns/preview/provider-adapter.js";
import { Preview } from "../../../src/patterns/preview/preview-element.js";

Preview.register();

afterEach(() => {
  document.body.innerHTML = "";
});

describe("resolvePreviewStatus", () => {
  it("prefers explicit status, then legacy ready, then idle", () => {
    expect(resolvePreviewStatus(null)).toBe("idle");
    expect(resolvePreviewStatus({})).toBe("idle");
    expect(resolvePreviewStatus({ ready: true })).toBe("ready");
    expect(resolvePreviewStatus({ ready: false })).toBe("loading");
    expect(resolvePreviewStatus({ ready: true, status: "error" })).toBe("error");
  });
});

describe("box-preview-element adapter mounting", () => {
  it("hands the adapter a stable stage node and unmounts on detach", () => {
    const createViewer = vi.fn().mockReturnValue(vi.fn());
    const adapter = createContentPreviewAdapter({ createViewer });

    const element = document.createElement("box-preview-element") as Preview;
    element.providerAdapter = adapter;
    document.body.append(element);

    const mountNode = element.shadowRoot?.querySelector('[part="stage-mount"]') as HTMLElement;
    expect(createViewer).toHaveBeenCalledWith(mountNode);
    expect(mountNode.hidden).toBe(false);
    expect(adapter.getMountedContainer()).toBe(mountNode);

    element.remove();
    expect(adapter.getMountedContainer()).toBeNull();
    expect(adapter.getState()).toMatchObject({ status: "idle" });
  });

  it("keeps live adapter sync after a detach + reattach", () => {
    const adapter = createStaticPreviewProviderAdapter({
      provider: { id: "p", label: "Provider" },
      state: { status: "ready" },
    });
    const element = document.createElement("box-preview-element") as Preview;
    element.providerAdapter = adapter;
    document.body.append(element);

    element.remove();
    document.body.append(element);

    adapter.setState({ status: "ready", pageLabel: "Page 4" });
    expect(element.shadowRoot?.textContent).toContain("Page 4");
  });

  it("survives chrome updates without destroying the mounted stage node", () => {
    const adapter = createContentPreviewAdapter({});
    const element = document.createElement("box-preview-element") as Preview;
    element.providerAdapter = adapter;
    document.body.append(element);

    const mountNode = element.shadowRoot?.querySelector('[part="stage-mount"]');
    element.heading = "Updated heading";

    expect(element.shadowRoot?.querySelector('[part="stage-mount"]')).toBe(mountNode);
  });
});

describe("box-preview-element status + errors", () => {
  it("renders the error state with role=alert and marks the status chip", () => {
    const element = document.createElement("box-preview-element") as Preview;
    element.adapterState = { status: "error", errorMessage: "File not found" };
    document.body.append(element);

    const error = element.shadowRoot?.querySelector('[part="error"]');
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.textContent).toContain("File not found");
    expect(element.shadowRoot?.querySelector('[part="status"]')?.getAttribute("data-status")).toBe("error");
  });

  it("marks the stage busy while loading", () => {
    const element = document.createElement("box-preview-element") as Preview;
    element.adapterState = { status: "loading" };
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="stage"]')?.getAttribute("aria-busy")).toBe("true");
  });

  it("emits action-error when the provider action rejects", async () => {
    const adapter = createStaticPreviewProviderAdapter({
      onAction: () => Promise.reject(new Error("nope")),
      provider: { id: "p", label: "Provider" },
    });
    const element = document.createElement("box-preview-element") as Preview;
    element.providerAdapter = adapter;
    element.actions = [{ id: "download", label: "Download" }];
    document.body.append(element);

    const errors = vi.fn();
    element.addEventListener("action-error", errors);
    (element.shadowRoot?.querySelector('[data-action-id="download"]') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(errors).toHaveBeenCalledTimes(1);
    expect(errors.mock.calls[0]?.[0]?.detail).toEqual({ action: "download", message: "nope" });
  });
});

describe("box-preview-element commands", () => {
  it("renders paging/zoom controls from numeric state and sends typed commands", () => {
    const sendCommand = vi.fn();
    const adapter = createStaticPreviewProviderAdapter({
      onCommand: sendCommand,
      provider: { id: "p", label: "Provider" },
      state: { status: "ready", page: 2, pageCount: 5, zoomPercent: 125 },
    });
    const element = document.createElement("box-preview-element") as Preview;
    element.providerAdapter = adapter;
    document.body.append(element);

    const commands = vi.fn();
    element.addEventListener("command", commands);

    expect(element.shadowRoot?.textContent).toContain("Page 2 of 5");
    expect(element.shadowRoot?.textContent).toContain("125%");

    (element.shadowRoot?.querySelector('[data-command="next-page"]') as HTMLButtonElement).click();
    expect(sendCommand).toHaveBeenCalledWith({ command: "next-page" });
    expect(commands.mock.calls[0]?.[0]?.detail).toEqual({
      command: { command: "next-page" },
      providerId: "p",
    });
  });

  it("disables paging controls at the bounds", () => {
    const adapter = createStaticPreviewProviderAdapter({
      onCommand: vi.fn(),
      provider: { id: "p", label: "Provider" },
      state: { status: "ready", page: 1, pageCount: 3 },
    });
    const element = document.createElement("box-preview-element") as Preview;
    element.providerAdapter = adapter;
    document.body.append(element);

    const prev = element.shadowRoot?.querySelector('[data-command="previous-page"]') as HTMLButtonElement;
    const next = element.shadowRoot?.querySelector('[data-command="next-page"]') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });

  it("renders no controls without a command channel", () => {
    const element = document.createElement("box-preview-element") as Preview;
    element.adapterState = { status: "ready", page: 1, pageCount: 3 };
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="controls"]')).toBeNull();
  });
});

describe("box-preview-element sidebar", () => {
  it("collapses the sidebar column when nothing is slotted", async () => {
    const element = document.createElement("box-preview-element") as Preview;
    document.body.append(element);

    expect(
      element.shadowRoot?.querySelector('[part="workspace"]')?.getAttribute("data-sidebar"),
    ).toBe("empty");

    const panel = document.createElement("div");
    panel.slot = "sidebar";
    panel.textContent = "Details";
    element.append(panel);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(
      element.shadowRoot?.querySelector('[part="workspace"]')?.getAttribute("data-sidebar"),
    ).toBe("filled");
  });
});
