// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ProgressBar } from "../../../src/components/feedback/progress-bar.js";

const mount = (configure: (element: ProgressBar) => void = () => {}): ProgressBar => {
  const element = document.createElement("box-progress-bar") as ProgressBar;
  configure(element);
  document.body.append(element);
  return element;
};

describe("ProgressBar", () => {
  beforeEach(() => {
    ProgressBar.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders percentage based on value and max", () => {
    const element = mount(bar => {
      bar.label = "Upload";
      bar.max = 200;
      bar.value = 50;
    });

    expect(element.shadowRoot?.textContent).toContain("Upload");
    expect(element.shadowRoot?.textContent).toContain("25%");
    expect(
      element.shadowRoot?.querySelector('[part="track"]')?.getAttribute("aria-valuetext"),
    ).toBe("25%");
  });

  describe("accessible name", () => {
    /**
     * The name belongs to the element carrying the progressbar role, and to
     * nothing else. The wrapper used to be a `role="group"` named
     * `${label} progress`, which both duplicated that name and stuttered.
     */
    it("names the progressbar with the label verbatim", () => {
      const element = mount(bar => {
        bar.label = "Upload";
      });

      expect(element.shadowRoot?.querySelector('[part="track"]')?.getAttribute("aria-label")).toBe(
        "Upload",
      );
    });

    it("does not append 'progress' to a label that is already the word", () => {
      // The default label is "Progress", so the old suffix announced
      // "Progress progress" on every unlabelled bar.
      const element = mount();

      const names = Array.from(element.shadowRoot?.querySelectorAll("[aria-label]") ?? []).map(
        node => node.getAttribute("aria-label"),
      );

      expect(names).toEqual(["Progress"]);
    });

    it("leaves exactly one named element, so the name is announced once", () => {
      const element = mount(bar => {
        bar.label = "Contract.pdf";
      });

      const named = element.shadowRoot?.querySelectorAll("[aria-label]") ?? [];

      expect(named.length).toBe(1);
      expect(named[0]?.getAttribute("part")).toBe("track");
    });

    it("keeps the name when the label is visually hidden", () => {
      const element = mount(bar => {
        bar.label = "Contract.pdf";
        bar.hideLabel = true;
      });

      expect(element.shadowRoot?.querySelector('[part="track"]')?.getAttribute("aria-label")).toBe(
        "Contract.pdf",
      );
    });
  });

  describe("hide-label", () => {
    it("reflects between property and attribute", () => {
      const element = mount(bar => {
        bar.hideLabel = true;
      });

      expect(element.hasAttribute("hide-label")).toBe(true);

      element.hideLabel = false;
      expect(element.hasAttribute("hide-label")).toBe(false);
      expect(element.hideLabel).toBe(false);
    });

    it("still renders the percentage", () => {
      // Only the label is dropped. A row that hides the label because the
      // filename sits above it still wants to show how far along it is.
      const element = mount(bar => {
        bar.hideLabel = true;
        bar.value = 40;
      });

      expect(element.shadowRoot?.querySelector('[part="value"]')?.textContent).toBe("40%");
    });
  });
});
