// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CodeBlock } from "../../../src/components/output/code-block.js";

describe("box-code-block", () => {
  beforeEach(() => {
    CodeBlock.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  const mount = (attrs: Record<string, string> = {}): CodeBlock => {
    const element = document.createElement("box-code-block") as CodeBlock;
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    document.body.append(element);
    return element;
  };

  const slotText = (element: CodeBlock): string =>
    element.shadowRoot?.querySelector("slot")?.textContent ?? "";

  it("renders code as text, never as markup", () => {
    // A snippet is the string most likely on any page to contain angle
    // brackets; rendering it as HTML would corrupt it and hand an injection
    // point to whatever produced it.
    const element = mount({ code: '<img src=x onerror="alert(1)">' });

    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(slotText(element)).toBe('<img src=x onerror="alert(1)">');
  });

  it("surfaces the language as a hook without interpreting it", () => {
    const code = mount({ code: "const a = 1;", language: "ts" }).shadowRoot?.querySelector(
      '[part="code"]',
    );

    expect(code?.getAttribute("data-language")).toBe("ts");
    expect(code?.getAttribute("class")).toBe("language-ts");
  });

  it("scrolls long lines rather than wrapping them by default", () => {
    // A wrapped line silently changes what the reader believes the source says.
    const styles = mount().shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styles).toContain("white-space: pre;");
    expect(styles).toContain("overflow-x: auto");
    expect(styles).toContain(":host([wrap])");
  });

  it("copies the code and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    const element = mount({ code: "bun install" });
    const copied = vi.fn();
    element.addEventListener("code-copied", copied);
    element.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy"]')!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith("bun install");
    expect(copied.mock.calls[0][0].detail).toEqual({ copied: true });
  });

  it("reports a refused clipboard rather than throwing at the host", async () => {
    // Clipboard access is refused in plenty of ordinary situations: an insecure
    // origin, a denied permission, a missing user gesture.
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    const element = mount({ code: "bun install" });
    const copied = vi.fn();
    element.addEventListener("code-copied", copied);
    element.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy"]')!.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(copied.mock.calls[0][0].detail).toEqual({ copied: false });
    expect(
      element.shadowRoot?.querySelector('[part="copy"]')?.getAttribute("data-copied"),
    ).toBe("false");
  });

  it("names the copy button for assistive technology", () => {
    const button = mount({ "copy-label": "Copy install command" }).shadowRoot?.querySelector(
      '[part="copy"]',
    );

    expect(button?.getAttribute("aria-label")).toBe("Copy install command");
  });

  it("hides the copy affordance when inline", () => {
    const styles = mount({ inline: "" }).shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styles).toContain(':host([inline]) [part="copy"]');
  });
});
