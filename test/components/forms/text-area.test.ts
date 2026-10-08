// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TextArea } from "../../../src/components/forms/text-area.js";

describe("TextArea", () => {
  beforeEach(() => {
    TextArea.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes while typing", () => {
    const element = document.createElement("box-text-area") as TextArea;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const textarea = element.shadowRoot?.querySelector('[part="textarea"]') as HTMLTextAreaElement | null;
    textarea!.value = "Notes";
    textarea?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "Notes" },
      }),
    );
  });

  it("forwards disabled state to the textarea", () => {
    const element = document.createElement("box-text-area") as TextArea;
    element.disabled = true;

    document.body.append(element);

    const textarea = element.shadowRoot?.querySelector('[part="textarea"]') as HTMLTextAreaElement | null;

    expect(textarea?.disabled).toBe(true);
  });

  it("forwards host focus to the textarea unless disabled", () => {
    const element = document.createElement("box-text-area") as TextArea;
    document.body.append(element);
    const textarea = element.shadowRoot?.querySelector('textarea');
    element.focus();
    expect(element.shadowRoot?.activeElement).toBe(textarea);
    element.disabled = true;
    const elsewhere = document.createElement("button");
    document.body.append(elsewhere);
    elsewhere.focus();
    element.focus();
    expect(document.activeElement).toBe(elsewhere);
  });
});
