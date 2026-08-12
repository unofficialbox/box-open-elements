// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AnnotationInspector,
} from "../../../src/patterns/preview/annotation-inspector.js";

describe("AnnotationInspector", () => {
  beforeEach(() => {
    AnnotationInspector.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the selected annotation details", () => {
    const element = document.createElement("box-annotation-inspector") as AnnotationInspector;
    element.heading = "Annotation Inspector";
    element.annotation = {
      id: "a1",
      author: "Morgan Lee",
      body: "Tighten the tagline hierarchy near the hero title.",
      toolLabel: "Comment",
      pageLabel: "Page 4",
      status: "Open",
      subject: "Hero copy",
      replies: [{ author: "Avery Chen", body: "Agreed, I’ll update the draft.", initials: "AC" }],
    };

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Annotation Inspector");
    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Hero copy");
    expect(element.shadowRoot?.textContent).toContain("Page 4");
    expect(element.shadowRoot?.textContent).toContain("Agreed, I’ll update the draft.");
  });

  it("emits action when an action button is clicked", () => {
    const element = document.createElement("box-annotation-inspector") as AnnotationInspector;
    const action = vi.fn();
    element.annotation = {
      id: "a1",
      author: "Morgan Lee",
      body: "Tighten the tagline hierarchy near the hero title.",
    };
    element.actions = [{ id: "resolve", label: "Resolve", tone: "primary" }];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="action"][data-action-id="resolve"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          action: "resolve",
          annotationId: "a1",
        },
      }),
    );
  });

  it("emits reply-selected when a reply is clicked", () => {
    const element = document.createElement("box-annotation-inspector") as AnnotationInspector;
    const selected = vi.fn();
    element.annotation = {
      id: "a1",
      author: "Morgan Lee",
      body: "Tighten the tagline hierarchy near the hero title.",
      replies: [{ author: "Avery Chen", body: "Agreed, I’ll update the draft.", initials: "AC" }],
    };
    element.addEventListener("reply-selected", selected);

    document.body.append(element);

    const reply = element.shadowRoot?.querySelector('[part="reply"]') as HTMLButtonElement | null;
    reply?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          author: "Avery Chen",
          body: "Agreed, I’ll update the draft.",
          initials: "AC",
          index: 0,
          annotationId: "a1",
        },
      }),
    );
  });

  it("renders reply timestamps when provided", () => {
    const element = document.createElement("box-annotation-inspector") as AnnotationInspector;
    element.annotation = {
      id: "a1",
      author: "Morgan Lee",
      body: "Tighten the tagline hierarchy near the hero title.",
      replies: [{ id: "r1", author: "Avery Chen", body: "Agreed.", createdAt: "2h ago" }],
    };

    document.body.append(element);

    const time = element.shadowRoot?.querySelector('[part="reply-time"]');
    expect(time?.textContent).toContain("2h ago");
  });

  it("emits reply-submitted from the composer", () => {
    const element = document.createElement("box-annotation-inspector") as AnnotationInspector;
    const submitted = vi.fn();
    element.composable = true;
    element.annotation = {
      id: "a1",
      author: "Morgan Lee",
      body: "Tighten the tagline hierarchy near the hero title.",
    };
    element.addEventListener("reply-submitted", submitted);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="composer-input"]') as HTMLTextAreaElement;
    const submit = element.shadowRoot?.querySelector('[part="composer-submit"]') as HTMLButtonElement;
    input.value = "  On it.  ";
    submit.click();

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          annotationId: "a1",
          body: "On it.",
        },
      }),
    );
    expect(input.value).toBe("");
  });

  it("hides the composer unless composable is set", () => {
    const element = document.createElement("box-annotation-inspector") as AnnotationInspector;
    document.body.append(element);

    const composer = element.shadowRoot?.querySelector('[part="composer"]') as HTMLElement | null;
    expect(composer?.hidden).toBe(true);

    element.composable = true;
    expect(composer?.hidden).toBe(false);
  });

  it("renders the color chip for safe color values", () => {
    const element = document.createElement("box-annotation-inspector") as AnnotationInspector;
    element.annotation = {
      id: "a1",
      author: "Morgan Lee",
      body: "Tighten the tagline hierarchy near the hero title.",
      color: "#f59e0b",
    };

    document.body.append(element);

    const chip = element.shadowRoot?.querySelector('[part="color-chip"]') as HTMLElement | null;
    expect(chip).not.toBeNull();
    expect(chip?.getAttribute("style")).toContain("--annotation-color:#f59e0b");
  });

  it("omits the color chip style for hostile color values", () => {
    const element = document.createElement("box-annotation-inspector") as AnnotationInspector;
    element.annotation = {
      id: "a1",
      author: "Morgan Lee",
      body: "Tighten the tagline hierarchy near the hero title.",
      color: "red;background:url(https://evil.example/x)",
    };

    document.body.append(element);

    const chip = element.shadowRoot?.querySelector('[part="color-chip"]');
    expect(chip).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="annotation"]')?.innerHTML ?? "").not.toContain(
      "evil.example",
    );
  });
});
