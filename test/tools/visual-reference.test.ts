import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

describe("Box visual reference contract", () => {
  it("pins source provenance and high-signal current Box measurements", () => {
    const reference = JSON.parse(
      readFileSync(join(root, "tools/preview/box-visual-reference.json"), "utf8"),
    ) as {
      schemaVersion: number;
      priority: string[];
      sources: Record<string, Record<string, string>>;
      roles: Record<string, Record<string, unknown>>;
    };

    expect(reference.schemaVersion).toBe(1);
    expect(reference.priority[0]).toBe("authenticated-current-box");
    expect(reference.sources["box-ui-elements"].commit).toMatch(/^[a-f0-9]{40}$/);
    expect(reference.roles.typography).toMatchObject({
      family: expect.stringMatching(/^InterVariable, Inter, Helvetica Neue/),
    });
    expect(reference.roles.controls).toMatchObject({
      compactHeight: "32px",
      defaultHeight: "40px",
      searchHeight: "48px",
      buttonRadius: "20px",
      searchRadius: "24px",
    });
    expect(reference.roles.rows).toMatchObject({
      file: expect.objectContaining({ height: "56px", radius: "12px", selectedBackground: "#f2f7fd" }),
      menuItem: expect.objectContaining({ height: "40px", radius: "12px" }),
    });
    expect(reference.roles.overlays).toMatchObject({
      menu: expect.objectContaining({ radius: "20px" }),
      dialog: expect.objectContaining({ width: "480px", radius: "24px" }),
    });
  });

  it("keeps the deterministic state matrix explicit and captureable", () => {
    const html = readFileSync(join(root, "tools/preview/state-matrix.html"), "utf8");

    for (const section of ["actions", "rows", "selection", "fields"]) {
      expect(html).toContain(`data-state-section="${section}"`);
    }
    for (const state of ["Rest", "Disabled", "Selected", "Checked", "Invalid", "Transient"]) {
      expect(html).toContain(state);
    }
    expect(html).toContain('dataset.stateMatrixReady = "true"');
    expect(html).toContain("--boe-token-font-family-base, InterVariable, Inter");
    expect(html).not.toContain("Lato");
    expect(html).not.toContain("setTimeout(");
  });
});
