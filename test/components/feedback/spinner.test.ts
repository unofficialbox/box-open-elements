// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxSpinnerElement, defineBoxSpinnerElement } from "../../../src/components/feedback/spinner.js";

describe("BoxSpinnerElement", () => {
  beforeEach(() => {
    defineBoxSpinnerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the provided label", () => {
    const element = document.createElement("box-spinner") as BoxSpinnerElement;
    element.label = "Loading folders";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Loading folders");
  });
});
