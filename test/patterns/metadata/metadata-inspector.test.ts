// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxMetadataInspectorElement,
  defineBoxMetadataInspectorElement,
} from "../../../src/patterns/metadata/metadata-inspector.js";

describe("BoxMetadataInspectorElement", () => {
  beforeEach(() => {
    defineBoxMetadataInspectorElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders sections and field values", () => {
    const element = document.createElement("box-metadata-inspector") as BoxMetadataInspectorElement;
    element.heading = "Metadata";
    element.sections = [
      {
        title: "Classification",
        fields: [
          { label: "Confidentiality", value: "Internal" },
          { label: "Department", value: "Marketing" },
        ],
      },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Metadata");
    expect(element.shadowRoot?.textContent).toContain("Classification");
    expect(element.shadowRoot?.textContent).toContain("Confidentiality");
    expect(element.shadowRoot?.textContent).toContain("Internal");
  });

  it("emits field-selected when a field is clicked", () => {
    const element = document.createElement("box-metadata-inspector") as BoxMetadataInspectorElement;
    const selected = vi.fn();
    element.sections = [
      {
        title: "Retention",
        fields: [{ label: "Policy", value: "FY26 Launch", description: "7-year retention schedule" }],
      },
    ];
    element.addEventListener("field-selected", selected);

    document.body.append(element);

    const field = element.shadowRoot?.querySelector('[part="field"]') as HTMLButtonElement | null;
    field?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          label: "Policy",
          section: "Retention",
          value: "FY26 Launch",
        },
      }),
    );
  });
});

