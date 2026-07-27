import { beforeEach, describe, expect, it } from "vitest";

import {
  DESIGN_PROFILE_CHANGE_EVENT,
  applyDesignProfile,
  boxDefaultDesignProfile,
  compactNeutralDesignProfile,
  createDesignProfileController,
  createDesignProfileStyleText,
  getDesignProfile,
  registerBuiltInDesignProfiles,
  registerDesignProfile,
  resolveDesignProfileProperties,
  type DesignProfileChangeDetail,
  type DesignProfileDefinition,
} from "../../src/foundations/profiles/index.js";

describe("foundations/profiles", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-design-profile");
    document.documentElement.style.cssText = "";
  });

  it("maps the typed profile schema to stable CSS custom properties", () => {
    const profile: DesignProfileDefinition = {
      name: "test-profile-map",
      radius: { control: "6px" },
      density: { controlHeight: "28px" },
      typography: { fontFamilyBase: "Inter, sans-serif" },
      motion: { interactive: "100ms" },
    };

    expect(resolveDesignProfileProperties(profile)).toEqual({
      "--boe-profile-radius-control": "6px",
      "--boe-profile-control-height": "28px",
      "--boe-profile-font-family-base": "Inter, sans-serif",
      "--boe-profile-motion-interactive": "100ms",
    });
  });

  it("registers and applies a profile to an element", () => {
    registerDesignProfile({
      name: "test-profile-apply",
      radius: { large: "8px" },
      elevation: { overlay: "0 8px 24px rgb(0 0 0 / 18%)" },
    });
    const target = document.createElement("div");

    const applied = applyDesignProfile(target, "test-profile-apply");

    expect(applied).toEqual([
      "--boe-profile-radius-large",
      "--boe-profile-shadow-overlay",
    ]);
    expect(target.style.getPropertyValue("--boe-profile-radius-large")).toBe("8px");
    expect(getDesignProfile("test-profile-apply")?.name).toBe("test-profile-apply");
  });

  it("switches profiles, removes stale properties, and emits profile metadata", () => {
    registerBuiltInDesignProfiles();
    const root = document.createElement("div");
    const details: DesignProfileChangeDetail[] = [];
    root.addEventListener(DESIGN_PROFILE_CHANGE_EVENT, event => {
      details.push((event as CustomEvent<DesignProfileChangeDetail>).detail);
    });
    const controller = createDesignProfileController({
      root,
      profile: boxDefaultDesignProfile.name,
      registerBuiltIns: false,
      storageKey: "test-profile",
    });

    controller.start();
    expect(root.style.getPropertyValue("--boe-profile-modal-width")).toBe("460px");

    controller.setProfile(compactNeutralDesignProfile.name);

    expect(root.dataset.designProfile).toBe("compact-neutral");
    expect(root.style.getPropertyValue("--boe-profile-radius-control")).toBe("6px");
    expect(root.style.getPropertyValue("--boe-profile-modal-width")).toBe("");
    expect(localStorage.getItem("test-profile")).toBe("compact-neutral");
    expect(details.at(-1)).toEqual({ profileName: "compact-neutral" });

    controller.stop();
    expect(root.hasAttribute("data-design-profile")).toBe(false);
    expect(root.style.getPropertyValue("--boe-profile-radius-control")).toBe("");
  });

  it("creates profile CSS for SSR and rejects unknown names", () => {
    const css = createDesignProfileStyleText(
      {
        name: "test-profile-css",
        density: { panelGap: "8px" },
      },
      { selector: ".app" },
    );

    expect(css).toBe(".app {\n  --boe-profile-panel-gap: 8px;\n}");
    expect(() => applyDesignProfile(document.body, "missing-profile")).toThrow(
      /Unknown design profile/,
    );
  });

  it("rejects a custom property that duplicates a typed profile property", () => {
    expect(() =>
      resolveDesignProfileProperties({
        name: "test-profile-duplicate",
        radius: { control: "6px" },
        customProperties: {
          "--boe-profile-radius-control": "8px",
        },
      }),
    ).toThrow(/provided by both/);
  });
});
