// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AnnotationThread,
} from "../../../src/patterns/preview/annotation-thread.js";

describe("AnnotationThread", () => {
  beforeEach(() => {
    AnnotationThread.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders thread entries", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
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

  it("patches action labels in place for IDs that would break a CSS selector", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    element.actions = [{ id: 'resolve\n"all"', label: "Resolve" }];
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement;
    element.actions = [{ id: 'resolve\n"all"', label: "Resolve all", tone: "primary" }];

    expect(element.shadowRoot?.querySelector('[part="action"]')).toBe(button);
    expect(button.textContent?.trim()).toBe("Resolve all");
    expect(button.dataset.tone).toBe("primary");
  });

  it("emits entry-selected when an entry is clicked", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
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
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
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

  it("renders entries as a list with listitem wrappers", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    element.entries = [
      { id: "a1", author: "Morgan Lee", body: "Tighten the hero spacing." },
      { id: "a2", author: "Avery Chen", body: "Resolved after export." },
    ];

    document.body.append(element);

    const list = element.shadowRoot?.querySelector('[part="entries"]');
    expect(list?.tagName).toBe("UL");
    expect(list?.getAttribute("role")).toBe("list");

    const items = Array.from(list?.children ?? []);
    expect(items).toHaveLength(2);
    items.forEach(item => {
      expect(item.tagName).toBe("LI");
      expect(item.getAttribute("role")).toBe("listitem");
      expect(item.querySelector('[part="entry"]')).not.toBeNull();
    });
  });

  it("hides the composer unless composable is set", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    document.body.append(element);

    const composer = element.shadowRoot?.querySelector('[part="composer"]') as HTMLElement | null;
    expect(composer?.hidden).toBe(true);

    element.composable = true;
    expect(composer?.hidden).toBe(false);
  });

  it("emits entry-submitted with the selected entry as inReplyToId", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    const submitted = vi.fn();
    element.composable = true;
    element.entries = [{ id: "a1", author: "Morgan Lee", body: "Tighten the hero spacing." }];
    element.selectedEntryId = "a1";
    element.addEventListener("entry-submitted", submitted);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="composer-input"]') as HTMLTextAreaElement;
    const submit = element.shadowRoot?.querySelector('[part="composer-submit"]') as HTMLButtonElement;
    input.value = "  Sounds good to me.  ";
    submit.click();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          body: "Sounds good to me.",
          inReplyToId: "a1",
        },
      }),
    );
    expect(input.value).toBe("");
  });

  it("emits entry-submitted with null inReplyToId when nothing is selected", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    const submitted = vi.fn();
    element.composable = true;
    element.addEventListener("entry-submitted", submitted);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="composer-input"]') as HTMLTextAreaElement;
    const submit = element.shadowRoot?.querySelector('[part="composer-submit"]') as HTMLButtonElement;
    input.value = "New thread entry";
    submit.click();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          body: "New thread entry",
          inReplyToId: null,
        },
      }),
    );
  });

  it("does not emit entry-submitted for empty or whitespace-only drafts", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    const submitted = vi.fn();
    element.composable = true;
    element.addEventListener("entry-submitted", submitted);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="composer-input"]') as HTMLTextAreaElement;
    const submit = element.shadowRoot?.querySelector('[part="composer-submit"]') as HTMLButtonElement;
    submit.click();
    input.value = "   ";
    submit.click();

    expect(submitted).not.toHaveBeenCalled();
  });

  it("submits the composer on Cmd/Ctrl+Enter", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    const submitted = vi.fn();
    element.composable = true;
    element.addEventListener("entry-submitted", submitted);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="composer-input"]') as HTMLTextAreaElement;
    input.value = "Keyboard submit";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }));

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          body: "Keyboard submit",
          inReplyToId: null,
        },
      }),
    );
  });

  it("preserves composer draft and focus when entries change", () => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    element.composable = true;
    element.entries = [{ id: "a1", author: "Morgan Lee", body: "Tighten the hero spacing." }];

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="composer-input"]') as HTMLTextAreaElement;
    input.focus();
    input.value = "Draft in progress";

    element.entries = [
      { id: "a1", author: "Morgan Lee", body: "Tighten the hero spacing." },
      { id: "a2", author: "Avery Chen", body: "Resolved after export." },
    ];
    element.selectedEntryId = "a2";

    const inputAfter = element.shadowRoot?.querySelector('[part="composer-input"]') as HTMLTextAreaElement;
    expect(inputAfter).toBe(input);
    expect(inputAfter.value).toBe("Draft in progress");
    expect(element.shadowRoot?.activeElement).toBe(inputAfter);
    expect(element.shadowRoot?.querySelectorAll('[part="entry"]')).toHaveLength(2);
  });
});
