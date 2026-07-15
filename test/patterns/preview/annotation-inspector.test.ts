// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxAnnotationInspectorElement,
  defineBoxAnnotationInspectorElement,
} from "../../../src/patterns/preview/annotation-inspector.js";

describe("BoxAnnotationInspectorElement", () => {
  beforeEach(() => {
    defineBoxAnnotationInspectorElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the selected annotation details", () => {
    const element = document.createElement("box-annotation-inspector") as BoxAnnotationInspectorElement;
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

    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Hero copy");
    expect(element.shadowRoot?.textContent).toContain("Page 4");
    expect(element.shadowRoot?.textContent).toContain("Agreed, I’ll update the draft.");
  });

  it("emits action when an action button is clicked", () => {
    const element = document.createElement("box-annotation-inspector") as BoxAnnotationInspectorElement;
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
    const element = document.createElement("box-annotation-inspector") as BoxAnnotationInspectorElement;
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
});
