// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxRichTextInputElement,
  defineBoxRichTextInputElement,
} from "../../../src/components/forms/rich-text-input.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

describe("BoxRichTextInputElement", () => {
  beforeEach(() => {
    defineBoxRichTextInputElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders the label and current html value", () => {
    const element = document.createElement("box-rich-text-input") as BoxRichTextInputElement;
    element.label = "Summary";
    element.value = "<p>Quarterly update</p>";

    document.body.append(element);

    const label = element.shadowRoot?.querySelector('[part="label"]') as HTMLElement | null;
    const editor = element.shadowRoot?.querySelector('[part="editor"]') as HTMLDivElement | null;

    expect(label?.textContent).toBe("Summary");
    expect(editor?.innerHTML).toBe("<p>Quarterly update</p>");
  });

  it("emits value-changed when the editor content changes", () => {
    const element = document.createElement("box-rich-text-input") as BoxRichTextInputElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const editor = element.shadowRoot?.querySelector('[part="editor"]') as HTMLDivElement | null;
    if (editor) {
      editor.innerHTML = "<p>Updated copy</p>";
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }

    expect(element.value).toBe("<p>Updated copy</p>");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "<p>Updated copy</p>" },
      }),
    );
  });

  it("invokes formatting commands from the toolbar", () => {
    const execCommand = vi.fn();
    const documentWithExecCommand = document as Document & {
      execCommand?: (command: string, showUi?: boolean) => boolean;
    };
    documentWithExecCommand.execCommand = execCommand;

    const element = document.createElement("box-rich-text-input") as BoxRichTextInputElement;
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-command="bold"]') as HTMLButtonElement | null;
    button?.click();

    expect(execCommand).toHaveBeenCalledWith("bold", false);
  });

  it("supports disabled state", () => {
    const element = document.createElement("box-rich-text-input") as BoxRichTextInputElement;
    element.disabled = true;

    document.body.append(element);

    const editor = element.shadowRoot?.querySelector('[part="editor"]') as HTMLDivElement | null;
    const buttons = element.shadowRoot?.querySelectorAll('[part="tool-button"]') ?? [];

    expect(editor?.contentEditable).toBe("false");
    expect([...buttons].every(button => (button as HTMLButtonElement).disabled)).toBe(true);
  });

  it("strips unsafe attributes when restoring form value", () => {
    const element = document.createElement("box-rich-text-input") as BoxRichTextInputElement;
    document.body.append(element);

    element.formStateRestoreCallback('<img src="x" onerror="alert(1)">');

    expect(element.value).not.toContain("onerror");
    expect(getMirroredFormValue(element.internals)).toBe('<img src="x">');
    const editor = element.shadowRoot?.querySelector('[part="editor"]') as HTMLDivElement | null;
    expect(editor?.innerHTML).not.toContain("onerror");
  });
});
