// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxIllustrationElement,
  defineBoxIllustrationElement,
} from "../../../src/components/visuals/illustration.js";
import { registerBoxDefaultDesignSystem, setActiveDesignSystem } from "../../../src/index.js";

describe("BoxIllustrationElement", () => {
  beforeEach(() => {
    defineBoxIllustrationElement();
    registerBoxDefaultDesignSystem({ setActive: true });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    setActiveDesignSystem(null);
  });

  it("renders title and caption", () => {
    const element = document.createElement("box-illustration") as BoxIllustrationElement;
    element.heading = "No recent activity";
    element.caption = "This illustration can support empty states and onboarding moments.";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("No recent activity");
    expect(element.shadowRoot?.textContent).toContain("This illustration can support empty states");
  });

  it("supports message as the preferred caption alias", () => {
    const element = document.createElement("box-illustration") as BoxIllustrationElement;
    element.message = "A reusable ambient note for empty states.";

    document.body.append(element);

    expect(element.caption).toBe("A reusable ambient note for empty states.");
    expect(element.shadowRoot?.querySelector('[part~="message"]')?.textContent).toContain("A reusable ambient note");
  });

  it("exposes an accessible illustration label", () => {
    const element = document.createElement("box-illustration") as BoxIllustrationElement;
    element.heading = "No recent activity";

    document.body.append(element);

    const figure = element.shadowRoot?.querySelector('[part="illustration"]') as HTMLElement | null;
    expect(figure?.getAttribute("role")).toBe("img");
    expect(figure?.getAttribute("aria-label")).toBe("No recent activity");
  });

  it("renders a registered Box illustration asset when requested", () => {
    const element = document.createElement("box-illustration") as BoxIllustrationElement;
    element.asset = "empty-state-folder";
    element.heading = "Folder empty";

    document.body.append(element);

    const art = element.shadowRoot?.querySelector('[part="art"]') as HTMLElement | null;
    expect(art?.dataset.assetSource).toBe("design-system");
    expect(art?.innerHTML).toContain("<svg");
  });
});
