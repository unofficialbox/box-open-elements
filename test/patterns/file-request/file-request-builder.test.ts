// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FileRequestBuilder,
} from "../../../src/patterns/file-request/file-request-builder.js";

describe("FileRequestBuilder", () => {
  beforeEach(() => {
    FileRequestBuilder.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("preserves keyboard focus when a setting updates the draft", () => {
    const element = new FileRequestBuilder();
    element.settings = [{ id: "notify", label: "Email notifications" }];
    document.body.append(element);
    const input = element.shadowRoot!.querySelector<HTMLInputElement>("input")!;
    input.focus();
    input.click();
    expect(element.value.notify).toBe(true);
    expect(element.shadowRoot!.activeElement?.getAttribute("data-setting-id")).toBe("notify");
  });

  it("renders settings and upload fields", () => {
    const element = document.createElement("box-file-request-builder") as FileRequestBuilder;
    element.settings = [
      { id: "link-protection", label: "Require email", description: "Ask uploaders for their email before upload." },
    ];
    element.fields = [
      { id: "campaign", label: "Campaign", required: true, description: "Used to route uploads automatically." },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Require email");
    expect(element.shadowRoot?.textContent).toContain("Campaign");
    expect(element.shadowRoot?.textContent).toContain("Required");
  });

  it("emits value-changed when a setting is toggled", () => {
    const element = document.createElement("box-file-request-builder") as FileRequestBuilder;
    const changed = vi.fn();
    element.settings = [
      { id: "require-email", label: "Require email" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[data-setting-id="require-email"]') as HTMLInputElement | null;
    input?.click();

    expect(element.value).toEqual({ "require-email": true });
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: { "require-email": true } },
      }),
    );
  });

  it("emits action with the current builder value", () => {
    const element = document.createElement("box-file-request-builder") as FileRequestBuilder;
    const action = vi.fn();
    element.value = { "require-email": true };
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="save"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { action: "save", value: { "require-email": true } },
      }),
    );
  });
});
