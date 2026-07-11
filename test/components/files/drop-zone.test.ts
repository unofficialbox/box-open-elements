// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxDropZoneElement,
  defineBoxDropZoneElement,
} from "../../../src/components/files/drop-zone.js";

describe("BoxDropZoneElement", () => {
  beforeEach(() => {
    defineBoxDropZoneElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders label and message", () => {
    const element = document.createElement("box-drop-zone") as BoxDropZoneElement;
    element.label = "Upload";
    element.message = "Drop files here";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Upload");
    expect(element.shadowRoot?.textContent).toContain("Drop files here");
  });

  it("supports description as a compatible alias for message", () => {
    const element = document.createElement("box-drop-zone") as BoxDropZoneElement;
    element.description = "Drag files here or click to browse.";

    document.body.append(element);

    expect(element.message).toBe("Drag files here or click to browse.");
    expect(element.shadowRoot?.querySelector('[part~="description"]')?.textContent).toContain("click to browse");
  });

  it("emits files-selected when input changes", () => {
    const element = document.createElement("box-drop-zone") as BoxDropZoneElement;
    const changed = vi.fn();
    element.addEventListener("files-selected", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.dispatchEvent(new Event("change"));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { files: [] },
      }),
    );
  });
});
