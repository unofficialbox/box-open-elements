import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProcessModeler,
  ProcessHistory,
  completeLayout,
  validateProjection,
  type ProcessProjection,
  type ProcessEditRequest,
} from "../../src/patterns/process-modeler/index.js";
const projection: ProcessProjection = {
  boxes: [
    { id: "a", node: { name: "Read" }, kind: "call", title: "Read" },
    {
      id: "b",
      node: { name: "Save" },
      kind: "call",
      title: "Save",
      path: ["body", 1],
    },
  ],
  lines: [{ id: "ab", from: "a", to: "b", label: "Yes", dashed: true }],
};
afterEach(() => {
  document.body.replaceChildren();
});
describe("process modeler", () => {
  it("uses host arrangement, accepts atomic layout, and avoids a fixed palette click position", () => {
    const builder = new ProcessModeler(); builder.document = structuredClone(projection);
    builder.model = { project: doc => doc, arrange: () => ({ boxes: { a: { x: 50, y: 60 }, b: { x: 350, y: 60 } } }) };
    builder.catalog = [{ kind: "call", label: "Call", create: () => ({}) }]; document.body.append(builder);
    builder.tidy(); expect(builder.layout.boxes.b.x).toBe(350);
    const before = builder.layout; builder.move("a", 90, 60);
    const moved = builder.layout;
    const after = { boxes: { ...moved.boxes, b: { x: 600, y: 90 } } };
    const edits = vi.fn(event => event.detail.accept({ undo() {}, redo() {}, layout: after }));
    builder.addEventListener("process-edit-request", edits);
    builder.shadowRoot!.querySelector<HTMLButtonElement>("[part=choices] button")!.click();
    expect(edits.mock.calls[0][0].detail.position).toBeUndefined();
    expect(builder.layout.boxes.b.x).toBe(600);
    builder.undo(); expect(builder.layout).toEqual(moved);
    builder.undo(); expect(builder.layout).toEqual(before);
    builder.redo(); builder.redo(); expect(builder.layout.boxes.b.x).toBe(600);
    builder.headingLevel = 5; builder.select("a");
    expect(builder.shadowRoot!.querySelector("h5[part=inspector-heading]")!.textContent).toBe("Read");
    expect(builder.shadowRoot!.querySelector<HTMLElement>("[part=palette]")!.hidden).toBe(false);
    builder.disableConnections = true;
    expect(builder.shadowRoot!.querySelector('[part=lead-target] select')).toBeNull();
    const connectKey = new KeyboardEvent("keydown", { key: "c", bubbles: true, cancelable: true });
    builder.shadowRoot!.querySelector('[part=canvas]')!.dispatchEvent(connectKey);
    expect(connectKey.defaultPrevented).toBe(false);
    expect(builder.shadowRoot!.querySelector('[aria-label^="Remove connection"]')).toBeNull();
    const calls = edits.mock.calls.length; builder.requestEdit({ type: "connect", from: "a", to: "b" });
    expect(edits.mock.calls).toHaveLength(calls);
  });
  it("prefers the accepted host layout over an add request's drop position", () => {
    const builder = new ProcessModeler();
    builder.document = structuredClone(projection);
    document.body.append(builder);
    builder.addEventListener("process-edit-request", event => {
      builder.document = {
        ...projection,
        boxes: [...projection.boxes, { id: "new", node: {}, kind: "call", title: "New" }],
      };
      (event as CustomEvent<ProcessEditRequest>).detail.accept({
        undo() {}, redo() {},
        layout: { boxes: { ...builder.layout.boxes, new: { x: 900, y: 100 } } },
      });
    });
    builder.requestEdit({ type: "add", position: { x: 420, y: 220 } });
    expect(builder.layout.boxes.new).toMatchObject({ x: 900, y: 100 });
  });
  it("lets host undo shortcuts through when history is empty or locked", () => {
    const builder = new ProcessModeler(); builder.document = structuredClone(projection); document.body.append(builder);
    const canvas = builder.shadowRoot!.querySelector("[part=canvas]")!;
    const key = (shiftKey = false) => {
      const event = new KeyboardEvent("keydown", { key: "z", metaKey: true, shiftKey, bubbles: true, cancelable: true });
      canvas.dispatchEvent(event); return event.defaultPrevented;
    };
    expect(key()).toBe(false); expect(key(true)).toBe(false);
    builder.move("a", 150, 50);
    expect(key()).toBe(true); expect(key()).toBe(false);
    expect(key(true)).toBe(true);
    builder.locked = true; expect(key()).toBe(false);
  });
  it("honors accepted add positions and undoes document and layout as one edit", () => {
    const builder = new ProcessModeler();
    builder.document = structuredClone(projection);
    builder.select("a");
    document.body.append(builder);
    expect(builder.selected?.id).toBe("a");
    const before = builder.document!;
    const beforeLayout = builder.layout;
    const after = {
      ...before,
      boxes: [
        ...before.boxes,
        { id: "new", node: {}, kind: "call", title: "New" },
      ],
    };
    builder.addEventListener("process-edit-request", (event) => {
      builder.document = after;
      (event as CustomEvent<ProcessEditRequest>).detail.accept({
        undo: () => {
          builder.document = before;
        },
        redo: () => {
          builder.document = after;
        },
      });
    });
    builder.requestEdit({ type: "add", position: { x: 420, y: 220 } });
    expect(builder.layout.boxes.new).toMatchObject({ x: 420, y: 220 });
    builder.undo();
    expect(builder.document).toBe(before);
    expect(builder.layout).toEqual(beforeLayout);
    builder.redo();
    expect(builder.document).toBe(after);
    expect(builder.layout.boxes.new).toMatchObject({ x: 420, y: 220 });
  });
  it("preserves history through controlled layout echoes and replayed host layout assignments", () => {
    const builder = new ProcessModeler();
    builder.document = structuredClone(projection);
    document.body.append(builder);
    const initial = builder.layout;
    builder.addEventListener("layout-changed", (event) => {
      builder.layout = (event as CustomEvent).detail.layout;
    });
    builder.move("a", 60, 40);
    builder.move("a", 100, 40);
    builder.undo();
    expect(builder.layout.boxes.a.x).toBe(60);
    builder.undo();
    expect(builder.layout).toEqual(initial);
    const before = builder.layout;
    const after = {
      ...before,
      boxes: { ...before.boxes, a: { x: 200, y: 200 } },
    };
    builder.history.record({
      undo: () => {
        builder.layout = before;
      },
      redo: () => {
        builder.layout = after;
      },
    });
    builder.undo();
    builder.redo();
    expect(builder.layout.boxes.a.x).toBe(200);
  });
  it("records resizing, routing and authored layout decorations in the same undo history", () => {
    const builder = new ProcessModeler();
    builder.document = structuredClone(projection);
    document.body.append(builder);
    builder.resize("a", 300, 130);
    expect(builder.layout.boxes.a.width).toBe(300);
    builder.undo();
    expect(builder.layout.boxes.a.width).toBe(224);
    builder.routeLine("ab", [{ x: 4, y: 8 }]);
    expect(builder.layout.lines?.ab).toEqual([{ x: 4, y: 8 }]);
    builder.setNote({ id: "note", text: "Explain", x: 0, y: 0 });
    builder.setSection({
      id: "section",
      title: "Phase",
      x: 0,
      y: 0,
      width: 400,
      height: 500,
    });
    expect(builder.shadowRoot!.querySelector("[part=note]")!.textContent).toBe(
      "Explain",
    );
    builder.setNote(null, "note");
    expect(builder.layout.notes).toEqual([]);
    builder.undo();
    expect(builder.layout.notes).toHaveLength(1);
    builder.locked = true;
    builder.setSection(null, "section");
    expect(builder.layout.sections).toHaveLength(1);
    builder.routeLine("missing", []);
    builder.resize("missing", 10, 10);
  });
  it("moves nested frame children together and rejects invalid grouping", () => {
    const frames: ProcessProjection = {
      boxes: [
        { id: "frame", title: "Repeat", kind: "repeat", node: {}, frame: true },
        { ...projection.boxes[0], parentId: "frame" },
      ],
      lines: [],
    };
    expect(() =>
      validateProjection({
        ...frames,
        boxes: [{ ...frames.boxes[0], parentId: "a" }, frames.boxes[1]],
      }),
    ).toThrow();
    const builder = new ProcessModeler();
    builder.document = frames;
    builder.layout = { boxes: { frame: { x: 0, y: 0 }, a: { x: 20, y: 40 } } };
    document.body.append(builder);
    builder.move("frame", 100, 50);
    expect(builder.layout.boxes.a).toEqual({ x: 120, y: 90 });
    builder.undo();
    expect(builder.layout.boxes.a).toEqual({ x: 20, y: 40 });
  });
  it("zooms, fits, pans from the overview, filters and emits named line requests", () => {
    const builder = new ProcessModeler();
    builder.document = structuredClone(projection);
    builder.catalog = [
      {
        kind: "call",
        label: "Call API",
        description: "Request",
        group: "Actions",
        create: () => ({}),
      },
    ];
    document.body.append(builder);
    builder.zoomBy(2);
    expect(
      builder.shadowRoot!.querySelector("[data-command=reset]")!.textContent,
    ).toBe("200%");
    builder.zoomBy(Number.NaN);
    builder.fit();
    const map = builder.shadowRoot!.querySelector("[part=minimap]")!;
    const before =
      builder.shadowRoot!.querySelector<HTMLElement>("[part=world]")!.style
        .transform;
    map.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(
      builder.shadowRoot!.querySelector<HTMLElement>("[part=world]")!.style
        .transform,
    ).not.toBe(before);
    const edits = vi.fn();
    builder.addEventListener("process-edit-request", edits);
    builder
      .shadowRoot!.querySelector<HTMLButtonElement>(
        '[aria-label="Insert a step here: Read to Save, Yes"]',
      )!
      .click();
    builder.shadowRoot!.querySelector<import("../../src/patterns/flow-builder/primitives.js").KindPicker>("[part=insert-chooser] box-kind-picker")!.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    expect(edits.mock.calls[0][0].detail).toMatchObject({
      type: "insert",
      lineId: "ab",
      kind: { kind: "call" },
    });
    builder
      .shadowRoot!.querySelector<HTMLButtonElement>("[part=choices] button")!
      .click();
    expect(edits.mock.calls[1][0].detail).toMatchObject({
      type: "add",
      kind: { kind: "call" },
    });
    const search =
      builder.shadowRoot!.querySelector<HTMLInputElement>("[part=search]")!;
    search.value = "missing";
    search.dispatchEvent(new Event("input"));
    expect(
      builder.shadowRoot!.querySelectorAll("[part=choices] button"),
    ).toHaveLength(0);
    expect(builder.shadowRoot!.querySelector("style")!.textContent).toContain(
      "[part=box],[part=frame]):focus-visible",
    );
  });
  it("validates IDs, preserves layout extras and fills missing positions", () => {
    expect(() =>
      validateProjection({
        boxes: [...projection.boxes, projection.boxes[0]],
        lines: [],
      }),
    ).toThrow();
    expect(() =>
      validateProjection({
        boxes: projection.boxes,
        lines: [{ id: "bad", from: "a", to: "missing" }],
      }),
    ).toThrow();
    const layout = completeLayout(projection, {
      boxes: { a: { x: 3, y: 5 } },
      notes: [{ id: "note", text: "A note", x: 0, y: 0 }],
    });
    expect(layout.boxes.a).toEqual({ x: 3, y: 5 });
    expect(layout.boxes.b).toBeDefined();
    expect(layout.notes).toHaveLength(1);
  });
  it("keeps document edits host-owned, including refusal and reversible accepted edits", () => {
    const builder = new ProcessModeler();
    builder.document = structuredClone(projection);
    document.body.append(builder);
    builder.requestEdit({ type: "delete", boxId: "a" });
    expect(builder.document!.boxes).toHaveLength(2);
    const undo = vi.fn();
    const redo = vi.fn();
    builder.addEventListener("process-edit-request", (event) =>
      (event as CustomEvent<ProcessEditRequest>).detail.accept({ undo, redo }),
    );
    builder.requestEdit({ type: "disconnect", lineId: "ab" });
    builder.undo();
    expect(undo).toHaveBeenCalledOnce();
    builder.redo();
    expect(redo).toHaveBeenCalledOnce();
    builder.locked = true;
    const changed = vi.fn();
    builder.addEventListener("process-edit-request", changed);
    builder.requestEdit({ type: "delete" });
    expect(changed).not.toHaveBeenCalled();
  });
  it("moves with snap and keyboard, preserves focus and supports undo, cancellation and lock", () => {
    const builder = new ProcessModeler();
    builder.document = structuredClone(projection);
    document.body.append(builder);
    const before = builder.layout;
    builder.snapToGrid = true;
    builder.move("a", 117, 103);
    expect(builder.layout.boxes.a.x).toBe(112);
    builder.undo();
    expect(builder.layout).toEqual(before);
    builder.redo();
    expect(builder.layout.boxes.a.y).toBe(96);
    builder.select("a");
    const box =
      builder.shadowRoot!.querySelector<HTMLElement>("[data-box-id=a]")!;
    box.focus();
    box.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(builder.layout.boxes.a.x).toBe(128);
    expect(
      (builder.shadowRoot!.activeElement as HTMLElement).dataset.boxId,
    ).toBe("a");
    builder.addEventListener("move-request", (event) => event.preventDefault());
    builder.move("a", 500, 500);
    expect(builder.layout.boxes.a.x).toBe(128);
    builder.locked = true;
    builder.tidy();
    expect(builder.layout.boxes.a.x).toBe(128);
  });
  it("draws named lines and frames, marks checks and cleans the host inspector", () => {
    const builder = new ProcessModeler();
    builder.document = structuredClone(projection);
    const cleanup = vi.fn();
    builder.renderInspector = (_, container) => {
      container.append(document.createElement("input"));
      return cleanup;
    };
    document.body.append(builder);
    expect(
      builder.shadowRoot!.querySelector(
        '[aria-label="Insert a step here: Read to Save, Yes"]',
      ),
    ).not.toBeNull();
    expect(
      builder
        .shadowRoot!.querySelector("[part=line]")!
        .getAttribute("stroke-dasharray"),
    ).toBe("6 4");
    builder.setValidation([{ message: "Missing endpoint", path: ["body", 1] }]);
    builder
      .shadowRoot!.querySelector<HTMLButtonElement>("[part=checks] button")!
      .click();
    expect(builder.selected?.id).toBe("b");
    expect(
      builder
        .shadowRoot!.querySelector("[data-box-id=b]")!
        .getAttribute("data-invalid"),
    ).toBe("true");
    builder.select("a");
    expect(cleanup).toHaveBeenCalledOnce();
    builder.remove();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
  it("supports history branching and bounds its records", () => {
    const history = new ProcessHistory();
    const undo = vi.fn();
    const redo = vi.fn();
    for (let i = 0; i < 101; i++) history.record({ undo, redo });
    for (let i = 0; i < 101; i++) history.undo();
    expect(undo).toHaveBeenCalledTimes(100);
    history.redo();
    expect(redo).toHaveBeenCalledOnce();
    history.record({ undo, redo });
    expect(history.canRedo).toBe(false);
    history.clear();
    expect(history.canUndo).toBe(false);
  });
});
