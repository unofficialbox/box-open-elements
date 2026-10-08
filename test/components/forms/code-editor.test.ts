import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeEditor } from "../../../src/components/forms/code-editor.js";
import { EditorView } from "@codemirror/view";
import { undo, undoDepth } from "@codemirror/commands";
import {
  currentCompletions,
  startCompletion,
  closeCompletion,
} from "@codemirror/autocomplete";
// jsdom lacks the browser selection command CodeMirror uses in shadow roots.
Object.defineProperty(document, "execCommand", {
  configurable: true,
  value: () => false,
});
Object.defineProperty(Range.prototype, "getClientRects", {
  configurable: true,
  value: () => [],
});
Object.defineProperty(Range.prototype, "getBoundingClientRect", {
  configurable: true,
  value: () => new DOMRect(),
});

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});
describe("code editor", () => {
  it("supports border-only active lines, hanging wraps and embedded chrome", () => {
    const editor = new CodeEditor();
    editor.value = "    long line that should wrap after the first visual segment";
    editor.wrap = true;
    editor.currentLineStyle = "border";
    editor.hideHelp = true;
    editor.hideProblems = true;
    editor.fillHeight = true;
    document.body.append(editor);
    const shadow = editor.shadowRoot!;
    expect(shadow.querySelector('[part="help"]')!.hasAttribute("hidden")).toBe(true);
    expect(shadow.querySelector('[part="toolbar"]')!.hasAttribute("hidden")).toBe(true);
    expect(shadow.querySelector(".cm-content")!.hasAttribute("aria-describedby")).toBe(false);
    const styles = [...shadow.querySelectorAll("style")].map(style => style.textContent).join("\n");
    expect(styles).toContain(":host([current-line-style=border]) .cm-activeLine");
    expect(styles).toContain(":host([fill-height])");
    expect(editor.currentLineStyle).toBe("border");
  });
  it("maps UTF-16 offsets and one-based line starts before and after mount", () => {
    const editor = new CodeEditor();
    editor.value = "first\nsecond\n";
    expect(editor.lineAt(7)).toEqual({ number: 2, from: 6, to: 12 });
    expect(editor.lineAt(999)).toEqual({ number: 3, from: 13, to: 13 });
    expect(editor.lineStart(2)).toBe(6);
    expect(editor.lineStart(999)).toBe(13);
    document.body.append(editor);
    expect(editor.lineAt(7)).toEqual({ number: 2, from: 6, to: 12 });
    expect(editor.lineStart(0)).toBe(0);
    const styles = [...editor.shadowRoot!.querySelectorAll("style")].map(style => style.textContent).join("\n");
    expect(styles).toContain("--boe-code-keyword");
    expect(styles).toContain("--boe-code-background");
    expect(styles).toContain("--boe-code-gutter");
  });
  it("exposes cursor changes, wrapping, highlighted lines and offset problems", () => {
    const editor = new CodeEditor(); editor.value = "first\nsecond"; editor.wrap = true;
    editor.highlights = [{ from: 6, to: 12 }]; document.body.append(editor);
    const selection = vi.fn(); editor.addEventListener("selection-changed", selection);
    const view = EditorView.findFromDOM(editor.shadowRoot!.querySelector(".cm-editor")!)!;
    view.dispatch({ selection: { anchor: 7, head: 9 } });
    expect(selection.mock.calls[0][0].detail).toEqual({ anchor: 7, head: 9 });
    expect(editor.shadowRoot!.querySelector(".cm-lineWrapping")).not.toBeNull();
    expect(editor.shadowRoot!.querySelector('[part=highlight]')!.textContent).toBe("second");
    editor.problems = [{ from: 6, to: 9, message: "Bad step", tone: "error" }];
    editor.navigateProblem(1); expect(editor.selection).toEqual({ anchor: 6, head: 9 });
    editor.revealLine(1, { center: true }); expect(editor.selection.anchor).toBe(0);
    editor.value = "x"; expect(() => editor.highlights = [{ from: 999, to: 1000 }]).not.toThrow();
    expect(() => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: "" } })).not.toThrow();
  });
  it("excludes silent host replacements from history and supports opt-in history", () => {
    const editor = new CodeEditor(); editor.value = "host"; document.body.append(editor);
    const view = EditorView.findFromDOM(editor.shadowRoot!.querySelector(".cm-editor")!)!;
    const changed = vi.fn(); editor.addEventListener("value-changed", changed);
    editor.value = "replacement"; expect(undoDepth(view.state)).toBe(0);
    editor.setValue("undoable", { addToHistory: true }); expect(undoDepth(view.state)).toBe(1);
    expect(changed).not.toHaveBeenCalled(); undo(view); expect(editor.value).toBe("replacement");
  });
  it("runs the host completion source with the current cursor context", async () => {
    const editor = new CodeEditor(); editor.value = "Step(\"";
    const source = vi.fn(context => ({ from: context.pos, options: [{ label: "load.files" }] }));
    editor.completionSource = source; document.body.append(editor);
    const view = EditorView.findFromDOM(editor.shadowRoot!.querySelector(".cm-editor")!)!;
    editor.selection = { anchor: 6, head: 6 }; editor.focus(); startCompletion(view);
    await vi.waitFor(() => expect(currentCompletions(view.state).map(option => option.label)).toContain("load.files"));
    expect(source).toHaveBeenCalled();
  });
  it("offers host methods after a receiver dot and full SDK names without duplicating prefixes", async () => {
    const editor = new CodeEditor();
    editor.value = "flow().st";
    editor.completions = [{ label: "step", type: "method" }];
    document.body.append(editor);
    const view = EditorView.findFromDOM(
      editor.shadowRoot!.querySelector(".cm-editor")!,
    )!;
    editor.selection = { anchor: 9, head: 9 };
    editor.focus();
    startCompletion(view);
    await vi.waitFor(() =>
      expect(
        currentCompletions(view.state).map((option) => option.label),
      ).toContain("step"),
    );
    closeCompletion(view);
    editor.value = "files.g";
    editor.completions = [{ label: "files.get" }];
    editor.selection = { anchor: 7, head: 7 };
    startCompletion(view);
    await vi.waitFor(() =>
      expect(
        currentCompletions(view.state).map((option) => option.label),
      ).toContain("files.get"),
    );
  });
  it("offers an Escape/Tab exit even when suggestions intercept Escape", () => {
    const editor = new CodeEditor();
    document.body.append(editor);
    const content =
      editor.shadowRoot!.querySelector<HTMLElement>(".cm-content")!;
    content.focus();
    content.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    const tab = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    content.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(editor.shadowRoot!.activeElement).not.toBe(content);
  });
  it("debounces edits and flushes changes on blur without emitting controlled updates", () => {
    vi.useFakeTimers();
    const editor = new CodeEditor();
    document.body.append(editor);
    const changed = vi.fn();
    editor.addEventListener("value-changed", changed);
    const view = EditorView.findFromDOM(
      editor.shadowRoot!.querySelector(".cm-editor")!,
    )!;
    view.dispatch({ changes: { from: 0, insert: "one" } });
    view.dispatch({ changes: { from: 3, insert: " two" } });
    expect(changed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0][0].detail.value).toBe("one two");
    view.dispatch({ changes: { from: 7, insert: " three" } });
    view.contentDOM.dispatchEvent(new FocusEvent("blur"));
    expect(changed).toHaveBeenCalledTimes(2);
    editor.value = "host update";
    vi.advanceTimersByTime(200);
    expect(changed).toHaveBeenCalledTimes(2);
  });
  it("renders Go and TypeScript, synchronizes value silently, exposes selection and diagnostics", () => {
    const editor = new CodeEditor();
    editor.value = "const name = 1;\nname;";
    const changed = vi.fn();
    editor.addEventListener("value-changed", changed);
    document.body.append(editor);
    expect(
      editor
        .shadowRoot!.querySelector(".cm-content")!
        .getAttribute("aria-label"),
    ).toBe("Code editor");
    editor.problems = [
      { line: 2, col: 1, endCol: 5, message: "Unknown name", tone: "error" },
      { line: 999, message: "Stale", tone: "warning" },
    ];
    editor.navigateProblem(1);
    expect(editor.selection).toEqual({ anchor: 16, head: 20 });
    expect(
      editor.shadowRoot!.querySelector("[part=problems]")!.textContent,
    ).toContain("Unknown name");
    editor.language = "go";
    editor.value = "package main";
    editor.readonly = true;
    expect(
      editor
        .shadowRoot!.querySelector(".cm-content")!
        .getAttribute("contenteditable"),
    ).toBe("false");
    expect(changed).not.toHaveBeenCalled();
    editor.revealLine(999);
    expect(editor.selection.anchor).toBe(0);
    editor.selection = { anchor: -3, head: 999 };
    expect(editor.selection).toEqual({ anchor: 0, head: 12 });
    editor.remove();
    document.body.append(editor);
    expect(editor.value).toBe("package main");
    expect(editor.shadowRoot!.querySelectorAll(".cm-editor")).toHaveLength(1);
  });
  it("accepts host completions and has no problem navigation when the list is empty", () => {
    const editor = new CodeEditor();
    editor.completions = [{ label: "files.get", type: "function" }];
    document.body.append(editor);
    expect(editor.completions[0].label).toBe("files.get");
    expect(
      editor.shadowRoot!.querySelector<HTMLButtonElement>("button")!.disabled,
    ).toBe(true);
    editor.navigateProblem(-1);
    editor.revealLine(1);
    expect(editor.selection).toEqual({ anchor: 0, head: 0 });
  });
});
