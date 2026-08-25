// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommentThread } from "../../../src/patterns/comments/index.js";
import { AnnotationThread } from "../../../src/patterns/preview/annotation-thread.js";

describe("CommentThread", () => {
  beforeEach(() => {
    CommentThread.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const mount = (configure: (element: CommentThread) => void = () => {}): CommentThread => {
    const element = document.createElement("box-comment-thread") as CommentThread;
    configure(element);
    document.body.append(element);
    return element;
  };

  it("stands on its own, with no anchor and no annotation vocabulary", () => {
    // The whole point of the split: a comment on a file, a task or a clause is
    // not an annotation and must not have to pretend to be one.
    const element = mount(el => {
      el.entries = [{ id: "c1", author: "Morgan Lee", body: "Ready for legal review." }];
    });

    expect(element.shadowRoot?.textContent).toContain("Comments");
    expect(element.shadowRoot?.textContent).toContain("Ready for legal review.");
    expect(element.shadowRoot?.querySelector('[part="anchor"]')).toBeNull();
  });

  it("renders the generic badge rather than a tool label", () => {
    const element = mount(el => {
      el.entries = [{ id: "c1", author: "Avery Chen", body: "Body", badge: "Internal" }];
    });

    expect(element.shadowRoot?.textContent).toContain("Internal");
  });

  it("carries comment-shaped composer copy by default", () => {
    const element = mount(el => (el.composable = true));
    const input = element.shadowRoot?.querySelector<HTMLTextAreaElement>('[part="composer-input"]');

    expect(element.shadowRoot?.querySelector('[part="composer-label"]')?.textContent).toBe("Comment");
    expect(input?.placeholder).toBe("Add a comment");
  });

  it("lets the host override the composer copy", () => {
    const element = mount(el => {
      el.composable = true;
      el.composerLabel = "Add note";
      el.placeholder = "Note for the deal team";
    });

    expect(element.shadowRoot?.querySelector('[part="composer-submit"]')?.textContent).toBe("Add note");
    expect(
      element.shadowRoot?.querySelector<HTMLTextAreaElement>('[part="composer-input"]')?.placeholder,
    ).toBe("Note for the deal team");
  });

  it("reports the selected entry as the reply target", () => {
    const element = mount(el => {
      el.composable = true;
      el.entries = [{ id: "c1", author: "Morgan Lee", body: "First" }];
      el.selectedEntryId = "c1";
    });

    const submitted = vi.fn();
    element.addEventListener("entry-submitted", submitted);
    const input = element.shadowRoot!.querySelector<HTMLTextAreaElement>('[part="composer-input"]')!;
    input.value = "  Replying  ";
    element.shadowRoot!.querySelector<HTMLButtonElement>('[part="composer-submit"]')!.click();

    expect(submitted).toHaveBeenCalledTimes(1);
    expect(submitted.mock.calls[0][0].detail).toEqual({ body: "Replying", inReplyToId: "c1" });
  });

  it("reports a top-level comment when nothing is selected", () => {
    const element = mount(el => {
      el.composable = true;
      el.entries = [{ id: "c1", author: "Morgan Lee", body: "First" }];
    });

    const submitted = vi.fn();
    element.addEventListener("entry-submitted", submitted);
    element.shadowRoot!.querySelector<HTMLTextAreaElement>('[part="composer-input"]')!.value = "New";
    element.shadowRoot!.querySelector<HTMLButtonElement>('[part="composer-submit"]')!.click();

    expect(submitted.mock.calls[0][0].detail.inReplyToId).toBeNull();
  });

  it("escapes author-supplied bodies", () => {
    const element = mount(el => {
      el.entries = [{ id: "c1", author: "Morgan", body: '<img src=x onerror="alert(1)">' }];
    });

    // The body is rendered as text, so no element is injected into the thread.
    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(element.shadowRoot?.textContent).toContain("<img src=x");
  });
});

describe("AnnotationThread over CommentThread", () => {
  beforeEach(() => {
    AnnotationThread.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const mount = (configure: (element: AnnotationThread) => void = () => {}): AnnotationThread => {
    const element = document.createElement("box-annotation-thread") as AnnotationThread;
    configure(element);
    document.body.append(element);
    return element;
  };

  it("is a comment thread", () => {
    expect(new AnnotationThread()).toBeInstanceOf(CommentThread);
  });

  it("keeps its own heading, empty text and composer copy", () => {
    // The subclass exists to specialise chrome; changing any of this would
    // break hosts that were on the previous implementation.
    const element = mount(el => (el.composable = true));

    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toBe("Annotation Thread");
    expect(element.shadowRoot?.querySelector('[part="empty"]')?.textContent).toBe(
      "No annotation thread entries available.",
    );
    expect(element.shadowRoot?.querySelector('[part="composer-label"]')?.textContent).toBe("Reply");
  });

  it("still honours toolLabel", () => {
    const element = mount(el => {
      el.entries = [{ id: "a1", author: "Avery Chen", body: "Body", toolLabel: "Highlight" }];
    });

    expect(element.shadowRoot?.querySelector('[part="entry-tool"]')?.textContent).toContain("Highlight");
  });

  it("names the page an anchor points at", () => {
    const element = mount(el => (el.anchor = { page: 3 }));

    expect(element.shadowRoot?.querySelector('[part="anchor"]')?.hasAttribute("hidden")).toBe(false);
    expect(element.shadowRoot?.querySelector('[part="anchor-location"]')?.textContent).toBe("Page 3");
  });

  it("describes a region by its page, not its coordinates", () => {
    // The numbers place the highlight for a renderer; they tell a reader
    // nothing, and a screen reader least of all.
    const element = mount(el => {
      el.anchor = { page: 2, region: { x: 10, y: 20, width: 30, height: 40 } };
    });

    const location = element.shadowRoot?.querySelector('[part="anchor-location"]')?.textContent ?? "";
    expect(location).toBe("Page 2 · region");
    expect(location).not.toContain("10");
  });

  it("shows quoted document text as a citation", () => {
    const element = mount(el => (el.anchor = { quote: "termination for convenience" }));

    expect(element.shadowRoot?.querySelector('[part="anchor-location"]')?.textContent).toBe("Selected text");
    expect(element.shadowRoot?.querySelector('[part="anchor-quote"]')?.textContent).toBe(
      "termination for convenience",
    );
  });

  it("hides the anchor entirely when there is nothing to say", () => {
    expect(mount().shadowRoot?.querySelector('[part="anchor"]')?.hasAttribute("hidden")).toBe(true);
    expect(
      mount(el => el.setAttribute("anchor", "not json"))
        .shadowRoot?.querySelector('[part="anchor"]')
        ?.hasAttribute("hidden"),
    ).toBe(true);
  });

  it("clears the anchor when set to null", () => {
    const element = mount(el => (el.anchor = { page: 5 }));
    element.anchor = null;

    expect(element.hasAttribute("anchor")).toBe(false);
    expect(element.shadowRoot?.querySelector('[part="anchor"]')?.hasAttribute("hidden")).toBe(true);
  });
});
