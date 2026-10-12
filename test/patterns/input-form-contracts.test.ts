// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "../../src/patterns/comments/comment-thread.js";
import { AnnotationThread } from "../../src/patterns/preview/annotation-thread.js";
import { Timeline } from "../../src/patterns/timeline/timeline.js";
import { FilterBar } from "../../src/patterns/search/filter-bar.js";
import { TileGroup } from "../../src/components/forms/tile-group.js";
const trackSubmission = (element: TileGroup) => {
  const submitted = vi.fn();
  Object.defineProperty(element.internals, "setFormValue", {value: submitted});
  return () => submitted.mock.lastCall?.[0] as FormData | null;
};
CommentThread.register(); AnnotationThread.register(); Timeline.register(); FilterBar.register(); TileGroup.register();
afterEach(() => { document.body.innerHTML = ""; });
describe("R29 composing shortcuts", () => {
  for (const tag of ["box-comment-thread", "box-annotation-thread", "box-timeline"]) {
    for (const signal of ["isComposing", "keyCode", "lifecycle"]) {
      it(`${tag} retains draft under ${signal}, then permits ordinary submit`, () => {
        const element = document.createElement(tag) as CommentThread | Timeline;
        element.composable = true; document.body.append(element);
        const input = element.shadowRoot!.querySelector("textarea")!;
        const submitted = vi.fn(); element.addEventListener("entry-submitted", submitted);
        input.value = "Composition draft";
        if (signal === "lifecycle") input.dispatchEvent(new CompositionEvent("compositionstart"));
        input.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter",ctrlKey:true,isComposing:signal === "isComposing",keyCode:signal === "keyCode" ? 229 : 13,bubbles:true,cancelable:true}));
        expect(submitted).not.toHaveBeenCalled(); expect(input.value).toBe("Composition draft");
        input.dispatchEvent(new CompositionEvent("compositionend"));
        input.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter",ctrlKey:true,bubbles:true,cancelable:true}));
        expect(submitted).toHaveBeenCalledTimes(1);
      });
    }
  }
});
describe("R33 query reconciliation", () => {
  it("applies focused property and attribute writes while retaining equal echoes/caret", () => {
    const element = document.createElement("box-filter-bar") as FilterBar;
    element.query = "Alpha"; document.body.append(element);
    const input = element.shadowRoot!.querySelector("input")!; input.focus();
    input.value = "Typed"; input.setSelectionRange(2,2);
    element.addEventListener("value-changed", () => { element.query = element.query; });
    input.dispatchEvent(new Event("input", {bubbles:true,composed:true}));
    expect(input.selectionStart).toBe(2);
    element.query = "Beta"; expect(input.value).toBe("Beta");
    element.setAttribute("query", "Gamma"); input.blur();
    expect(input.value).toBe("Gamma"); expect(element.query).toBe("Gamma");
  });
});
describe("R11 tile submission", () => {
  it("submits checked enabled options as named entries and restores reset state", () => {
    const element = document.createElement("box-tile-group") as TileGroup;
    const submission = trackSubmission(element);
    element.name = "plan"; element.multiple = true;
    element.options = [{id:"a",label:"A"},{id:"b",label:"B"},{id:"c",label:"C",disabled:true}];
    element.value = "a"; document.body.append(element); element.value = "a,b,c";
    const internals = (element as TileGroup & {internals:ElementInternals}).internals;
    expect(internals).toBeDefined();
    expect((submission() as FormData).getAll("plan")).toEqual(["a","b"]);
    (element as TileGroup & {formResetCallback():void}).formResetCallback();
    expect(element.value).toBe("a");
  });
});

for (const tag of ["box-comment-thread", "box-annotation-thread", "box-timeline"]) {
  for (const interruption of ["blur", "reconnect", "hide"]) {
    it(`${tag} resets interrupted composition after ${interruption}`, () => {
      const element = document.createElement(tag) as CommentThread | Timeline;
      element.composable = true; document.body.append(element);
      const input = element.shadowRoot!.querySelector("textarea")!;
      const submitted = vi.fn(); element.addEventListener("entry-submitted", submitted);
      input.value = "Draft"; input.dispatchEvent(new CompositionEvent("compositionstart"));
      if (interruption === "blur") input.dispatchEvent(new FocusEvent("blur"));
      if (interruption === "reconnect") { element.remove(); document.body.append(element); }
      if (interruption === "hide") { element.composable = false; element.composable = true; }
      input.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter",metaKey:true,bubbles:true,cancelable:true}));
      expect(submitted).toHaveBeenCalledTimes(1);
    });
  }
}

it("FilterBar retains a current query through other updates and reentrant host replacement", () => {
  const element = new FilterBar(); document.body.append(element);
  const input = element.shadowRoot!.querySelector("input")!;
  input.focus(); input.value = "Typed";
  input.dispatchEvent(new Event("input", {bubbles:true,composed:true}));
  element.label = "Updated filters";
  expect(element.query).toBe("Typed"); expect(element.getAttribute("query")).toBe("Typed");
  expect(input.value).toBe("Typed");
  element.addEventListener("value-changed", () => { element.query = "Host"; }, {once:true});
  input.value = "Next"; input.dispatchEvent(new Event("input", {bubbles:true,composed:true}));
  expect(element.query).toBe("Host"); expect(input.value).toBe("Host");
  input.dispatchEvent(new Event("change")); expect(element.query).toBe("Host");
  element.remove(); element.query = "Detached"; document.body.append(element);
  expect(input.value).toBe("Detached");
});

it("TileGroup restores the full initial selection including disabled options after name changes", () => {
  const element = new TileGroup(); const submission = trackSubmission(element); element.name = "old"; element.multiple = true;
  element.options = [{id:"a",label:"A"},{id:"b",label:"B",disabled:true}];
  element.value = "a,b"; document.body.append(element);
  element.value = ""; element.name = "new"; element.formResetCallback();
  expect(element.value).toBe("a,b");
  expect((submission() as FormData).getAll("new")).toEqual(["a"]);
});

it("TileGroup observes selection, option availability, omission, reconnect and state restoration", () => {
  const element = new TileGroup(); const submission = trackSubmission(element); element.name = "plan";
  element.options = [{id:"a",label:"A"},{id:"b",label:"B"}]; element.value = "a"; document.body.append(element);
  element.value = "b";
  expect((submission() as FormData).getAll("plan")).toEqual(["b"]);
  element.setAttribute("disabled", ""); expect(submission()).toBe(null);
  expect(element.shadowRoot!.querySelector("fieldset")!.disabled).toBe(true);
  element.removeAttribute("disabled");
  element.options = [{id:"a",label:"A"}]; expect(submission()).toBe(null);
  element.formStateRestoreCallback("a");
  expect(element.selected).toEqual(["a"]);
  element.remove(); document.body.append(element); element.formResetCallback();
  expect(element.value).toBe("a");
  element.name = ""; expect(submission()).toBe(null);
});

it("FilterBar applies same-value property and attribute authority to an unconsumed native draft", () => {
  const element = new FilterBar(); element.query = "Alpha"; document.body.append(element);
  const input = element.shadowRoot!.querySelector("input")!; input.focus();
  input.value = "Pending"; element.query = "Alpha"; expect(input.value).toBe("Alpha");
  input.value = "Pending again"; element.setAttribute("query", "Alpha"); expect(input.value).toBe("Alpha");
});

it("TileGroup omits and restores its submission when native disabled callbacks change", () => {
  const element = new TileGroup(), submission = trackSubmission(element);
  element.name = "plan"; element.options = [{id:"a",label:"A"}]; element.value = "a"; document.body.append(element);
  element.formDisabledCallback(true); expect(submission()).toBe(null);
  element.formDisabledCallback(false); expect((submission() as FormData).getAll("plan")).toEqual(["a"]);
});

it("FilterBar preserves a pending native edit when a host capture listener updates presentation", () => {
  const element = new FilterBar(); element.query = "Alpha"; document.body.append(element);
  const input = element.shadowRoot!.querySelector("input")!; input.focus();
  element.addEventListener("input", () => { element.label = "Updated during input"; }, {capture:true});
  input.value = "Native edit"; input.setSelectionRange(3,3);
  input.dispatchEvent(new Event("input", {bubbles:true,composed:true}));
  expect(element.query).toBe("Native edit"); expect(input.value).toBe("Native edit");
  expect(input.selectionStart).toBe(3); expect(element.getAttribute("query")).toBe("Native edit");
});

it("TileGroup restores its exact saved string for array-looking option IDs", () => {
  const element = new TileGroup(), submitted = vi.fn();
  Object.defineProperty(element.internals, "setFormValue", {value: submitted});
  element.name = "plan"; element.options = [{id:"[1]",label:"Array-looking"},{id:"1",label:"Other"}];
  element.value = "[1]"; document.body.append(element);
  const state = submitted.mock.lastCall![1]; expect(state).toBe("[1]");
  element.value = "1"; element.formStateRestoreCallback(state);
  expect(element.value).toBe("[1]");
  expect((submitted.mock.lastCall![0] as FormData).getAll("plan")).toEqual(["[1]"]);
  expect(element.shadowRoot!.querySelector<HTMLInputElement>('input[value="[1]"]')!.checked).toBe(true);
});
