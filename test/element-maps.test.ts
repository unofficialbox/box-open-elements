// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { Select } from "../src/components/forms/select.js";
import { TextField } from "../src/components/forms/text-field.js";
// Side-effect-free: the module only carries the global tag-name augmentation.
import type { BoxElementTagName } from "../src/element-maps.js";

describe("element maps", () => {
  it("types createElement and querySelector for box-* tags", () => {
    Select.register();
    TextField.register();

    // These assignments are the test: they compile only if the global
    // HTMLElementTagNameMap augmentation resolves the tags to the classes.
    const select: Select = document.createElement("box-select");
    const field: TextField = document.createElement("box-text-field");
    document.body.append(select, field);
    const found: Select | null = document.querySelector("box-select");

    expect(found).toBe(select);
    expect(field).toBeInstanceOf(TextField);

    const tag: BoxElementTagName = "box-select";
    expect(tag).toBe("box-select");
  });
});
