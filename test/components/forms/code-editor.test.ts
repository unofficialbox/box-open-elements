import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeEditor } from "../../../src/components/forms/code-editor.js";
import { EditorView } from "@codemirror/view";
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
