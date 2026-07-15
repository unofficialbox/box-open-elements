// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxAnnotationThreadElement,
  defineBoxAnnotationThreadElement,
} from "../../../src/patterns/preview/annotation-thread.js";

describe("BoxAnnotationThreadElement", () => {
  beforeEach(() => {
    defineBoxAnnotationThreadElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders thread entries", () => {
    const element = document.createElement("box-annotation-thread") as BoxAnnotationThreadElement;
    element.heading = "Annotation Thread";
    element.entries = [
      { id: "a1", author: "Morgan Lee", body: "Tighten the hero spacing.", toolLabel: "Comment", status: "Open" },
      { id: "a2", author: "Avery Chen", body: "Resolved after export.", toolLabel: "Highlight", status: "Resolved" },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Annotation Thread");
    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Resolved after export.");
  });

  it("emits entry-selected when an entry is clicked", () => {
    const element = document.createElement("box-annotation-thread") as BoxAnnotationThreadElement;
    const selected = vi.fn();
    element.entries = [{ id: "a1", author: "Morgan Lee", body: "Tighten the hero spacing." }];
    element.addEventListener("entry-selected", selected);

    document.body.append(element);

    const entry = element.shadowRoot?.querySelector('[part="entry"][data-entry-id="a1"]') as HTMLButtonElement | null;
    entry?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          id: "a1",
          author: "Morgan Lee",
          body: "Tighten the hero spacing.",
        },
      }),
    );
    expect(element.selectedEntryId).toBe("a1");
  });

  it("emits action with selected entry context", () => {
    const element = document.createElement("box-annotation-thread") as BoxAnnotationThreadElement;
    const action = vi.fn();
    element.entries = [{ id: "a1", author: "Morgan Lee", body: "Tighten the hero spacing." }];
    element.selectedEntryId = "a1";
    element.actions = [{ id: "resolve", label: "Resolve", tone: "primary" }];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="action"][data-action-id="resolve"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          action: "resolve",
          selectedEntryId: "a1",
        },
      }),
    );
  });
});
