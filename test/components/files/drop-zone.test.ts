// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DropZone,
} from "../../../src/components/files/drop-zone.js";

describe("DropZone", () => {
  beforeEach(() => {
    DropZone.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders label and message", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    element.label = "Upload";
    element.message = "Drop files here";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Upload");
    expect(element.shadowRoot?.textContent).toContain("Drop files here");
  });

  it("supports description as a compatible alias for message", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    element.description = "Drag files here or click to browse.";

    document.body.append(element);

    expect(element.message).toBe("Drag files here or click to browse.");
    expect(element.shadowRoot?.querySelector('[part~="description"]')?.textContent).toContain("click to browse");
  });

  it("emits files-selected with entries and files when input changes", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    const changed = vi.fn();
    element.addEventListener("files-selected", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;
    const file = new File(["x"], "q1.pdf");
    Object.defineProperty(file, "webkitRelativePath", { value: "docs/2026/q1.pdf" });
    Object.defineProperty(input, "files", { value: [file] });
    input.dispatchEvent(new Event("change"));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          // `entries` carries the folder each file came from; `files` stays a
          // flat list so hosts that never cared about folders keep working.
          entries: [{ file, path: "docs/2026" }],
          files: [file],
          skipped: [],
        },
      }),
    );
  });

  it("stays quiet when the picker is dismissed without choosing anything", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    const changed = vi.fn();
    element.addEventListener("files-selected", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.dispatchEvent(new Event("change"));

    expect(changed).not.toHaveBeenCalled();
  });

  it("passes accept through to the file input", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    element.accept = ".pdf,.docx";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;
    expect(input.accept).toBe(".pdf,.docx");

    element.accept = "";
    expect(input.accept).toBe("");
    expect(element.hasAttribute("accept")).toBe(false);
  });

  it("turns the browse dialog into a folder picker when directories is set", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    element.directories = true;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;
    expect(input.hasAttribute("webkitdirectory")).toBe(true);

    element.directories = false;
    expect(input.hasAttribute("webkitdirectory")).toBe(false);
  });

  it("reads a dropped folder before the item list is emptied", async () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    const changed = vi.fn();
    element.addEventListener("files-selected", changed);
    document.body.append(element);

    const file = new File(["x"], "a.txt");
    const item = {
      kind: "file",
      type: "",
      getAsFile: () => null,
      webkitGetAsEntry: () => ({
        isDirectory: true,
        isFile: false,
        name: "docs",
        createReader: () => {
          let done = false;
          return {
            readEntries: (onSuccess: (entries: unknown[]) => void) => {
              const batch = done
                ? []
                : [
                    {
                      isDirectory: false,
                      isFile: true,
                      name: "a.txt",
                      file: (resolve: (value: File) => void) => resolve(file),
                    },
                  ];
              done = true;
              onSuccess(batch);
            },
          };
        },
      }),
    };

    const zone = element.shadowRoot?.querySelector('[part="zone"]') as HTMLLabelElement;
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", {
      value: { files: [], items: [item] },
    });
    zone.dispatchEvent(drop);

    // The traversal is async; the capture that made it possible was not.
    await vi.waitFor(() => expect(changed).toHaveBeenCalled());
    expect(changed.mock.calls[0]![0].detail.entries).toEqual([{ file, path: "docs" }]);
    expect(zone.dataset.dragging).toBe("false");
  });

  it("preserves the file input across label updates while dragging", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    element.label = "Upload";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;
    const zone = element.shadowRoot?.querySelector('[part="zone"]') as HTMLLabelElement;
    input.focus();
    expect(element.shadowRoot?.activeElement).toBe(input);

    zone.dispatchEvent(new Event("dragenter", { bubbles: true }));
    element.label = "Drop to upload";

    const nextInput = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;
    expect(nextInput).toBe(input);
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(zone.dataset.dragging).toBe("true");
    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Drop to upload");
  });

  it("uses compact drop-zone shell styles", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 0.75rem;");
    expect(styles).toContain("border-radius: var(--boe-profile-radius-large, 16px);");
  });

  it("includes focus-visible and hover styles for the drop zone", () => {
    const element = document.createElement("box-drop-zone") as DropZone;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain('[part="zone"]:hover');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });
});
