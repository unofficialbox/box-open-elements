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

  it("uses compact surface, toolbar, button, and editor styles", () => {
    const element = document.createElement("box-rich-text-input") as BoxRichTextInputElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("gap: 0.45rem;");
    expect(styles).toContain("padding: 0.5rem;");
    expect(styles).toContain("min-inline-size: 2rem;");
    expect(styles).toContain("block-size: 2rem;");
    expect(styles).toContain("border-radius: 16px;");
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

  it("allowlists formatting tags and strips unsafe markup on restore", () => {
    const element = document.createElement("box-rich-text-input") as BoxRichTextInputElement;
    document.body.append(element);

    element.formStateRestoreCallback(
      '<p onclick="alert(1)">Hi</p><img src="x" onerror="alert(1)"><script>x</script>',
    );

    expect(element.value).toBe("<p>Hi</p>");
    expect(element.value).not.toContain("onerror");
    expect(element.value).not.toContain("script");
    expect(getMirroredFormValue(element.internals)).toBe("<p>Hi</p>");
    const editor = element.shadowRoot?.querySelector('[part="editor"]') as HTMLDivElement | null;
    expect(editor?.innerHTML).toBe("<p>Hi</p>");
  });

  it("sanitizes pasted HTML before insertion", () => {
    const element = document.createElement("box-rich-text-input") as BoxRichTextInputElement;
    document.body.append(element);

    const editor = element.shadowRoot?.querySelector('[part="editor"]') as HTMLDivElement;
    const execCommand = vi.fn();
    (document as Document & { execCommand?: typeof execCommand }).execCommand = execCommand;

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true }) as Event & {
      clipboardData: { getData: (type: string) => string };
    };
    pasteEvent.clipboardData = {
      getData: (type: string) =>
        type === "text/html" ? '<p onclick="alert(1)">Pasted</p><img src=x onerror=alert(1)>' : "",
    };
    editor.dispatchEvent(pasteEvent);

    expect(execCommand).toHaveBeenCalledWith("insertHTML", false, "<p>Pasted</p>");
    expect(element.value).toBe("<p>Pasted</p>");
  });
});
