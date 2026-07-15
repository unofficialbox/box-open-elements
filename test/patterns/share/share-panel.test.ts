// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxSharePanelElement, defineBoxSharePanelElement } from "../../../src/patterns/share/share-panel.js";

describe("BoxSharePanelElement", () => {
  beforeEach(() => {
    defineBoxSharePanelElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders shared link, settings, and collaborators", () => {
    const element = document.createElement("box-share-panel") as BoxSharePanelElement;
    element.heading = "Share";
    element.sharedLink = {
      access: "Company",
      url: "https://box.dev/s/blueprint",
      expiresAt: "Apr 15",
    };
    element.settings = [
      { label: "Can download", value: "Enabled" },
      { label: "Password", value: "Required", tone: "accent" },
    ];
    element.collaborators = [
      { name: "Morgan Lee", role: "Editor", description: "Content Designer" },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("https://box.dev/s/blueprint");
    expect(element.shadowRoot?.textContent).toContain("Can download");
    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Editor");
  });

  it("emits action and collaborator-selected events", () => {
    const element = document.createElement("box-share-panel") as BoxSharePanelElement;
    const action = vi.fn();
    const collaboratorSelected = vi.fn();
    element.sharedLink = {
      access: "Open",
      url: "https://box.dev/s/share",
    };
    element.actions = [
      { id: "invite", label: "Invite people", tone: "primary" },
    ];
    element.collaborators = [
      { id: "1", name: "Avery Chen", role: "Viewer", description: "External agency" },
    ];
    element.addEventListener("action", action);
    element.addEventListener("collaborator-selected", collaboratorSelected);

    document.body.append(element);

    const actionButton = element.shadowRoot?.querySelector('[data-action-id="invite"]') as HTMLButtonElement | null;
    const collaboratorButton = element.shadowRoot?.querySelector('[data-collaborator-name="Avery Chen"]') as HTMLButtonElement | null;

    actionButton?.click();
    collaboratorButton?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { action: "invite" },
      }),
    );
    expect(collaboratorSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          name: "Avery Chen",
          role: "Viewer",
        }),
      }),
    );
  });
});
