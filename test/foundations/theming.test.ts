import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DARK_MODE_MEDIA_QUERY,
  THEME_CHANGE_EVENT,
  createThemeController,
  createThemeInitializationScript,
  type ThemeChangeDetail,
} from "../../src/foundations/theming/index.js";
import {
  getActiveDesignSystem,
  registerDesignSystem,
} from "../../src/foundations/tokens/index.js";

interface MediaQueryHarness {
  mediaQueryList: MediaQueryList;
  setMatches(matches: boolean): void;
  listenerCount(): number;
}

const createMediaQueryHarness = (initialMatches: boolean): MediaQueryHarness => {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: DARK_MODE_MEDIA_QUERY,
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener as (event: MediaQueryListEvent) => void);
    }),
    removeEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener as (event: MediaQueryListEvent) => void);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  return {
    mediaQueryList,
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media: DARK_MODE_MEDIA_QUERY } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
    listenerCount: () => listeners.size,
  };
};

describe("foundations/theming", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-test-theme");
    document.documentElement.style.cssText = "";
  });

  it("starts from a stored preference and applies the matching built-in bundle", () => {
    localStorage.setItem("theme-test", "dark");
    const root = document.createElement("div");
    const controller = createThemeController({
      root,
      storageKey: "theme-test",
      mediaQueryList: null,
    });

    controller.start();

    expect(controller.getPreference()).toBe("dark");
    expect(controller.getResolvedTheme()).toBe("dark");
    expect(getActiveDesignSystem()?.name).toBe("box-dark");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.style.colorScheme).toBe("dark");
    expect(root.style.getPropertyValue("--boe-token-surface-surface")).toBe("#1c1c1c");
  });

  it("tracks system preference changes only while running in system mode", () => {
    const root = document.createElement("div");
    const media = createMediaQueryHarness(false);
    const details: ThemeChangeDetail[] = [];
    root.addEventListener(THEME_CHANGE_EVENT, event => {
      details.push((event as CustomEvent<ThemeChangeDetail>).detail);
    });
    const controller = createThemeController({
      root,
      storageKey: null,
      preference: "system",
      mediaQueryList: media.mediaQueryList,
    });

    controller.start();
    media.setMatches(true);

    expect(controller.getResolvedTheme()).toBe("dark");
    expect(details.at(-1)).toEqual({
      preference: "system",
      resolvedTheme: "dark",
      designSystemName: "box-dark",
    });

    controller.setPreference("light");
    media.setMatches(false);
    expect(controller.getResolvedTheme()).toBe("light");

    controller.stop();
    expect(media.listenerCount()).toBe(0);
    media.setMatches(true);
    expect(controller.getResolvedTheme()).toBe("light");
  });

  it("toggles the resolved theme and persists the explicit preference", () => {
    const root = document.createElement("div");
    const media = createMediaQueryHarness(true);
    const controller = createThemeController({
      root,
      storageKey: "theme-toggle-test",
      preference: "system",
      mediaQueryList: media.mediaQueryList,
    });

    controller.start();
    controller.toggle();

    expect(controller.getPreference()).toBe("light");
    expect(controller.getResolvedTheme()).toBe("light");
    expect(localStorage.getItem("theme-toggle-test")).toBe("light");
  });

  it("removes tokens that are absent from the next custom design system", () => {
    registerDesignSystem({
      name: "test-light",
      tokens: { Shared: "#fff", LightOnly: "light" },
    });
    registerDesignSystem({
      name: "test-dark",
      tokens: { Shared: "#000" },
    });
    const root = document.createElement("div");
    root.style.setProperty("--consumer-owned", "keep");
    const controller = createThemeController({
      root,
      preference: "light",
      storageKey: null,
      mediaQueryList: null,
      lightDesignSystem: "test-light",
      darkDesignSystem: "test-dark",
      registerBuiltIns: false,
    });

    controller.start();
    expect(root.style.getPropertyValue("--boe-token-light-only")).toBe("light");

    controller.setPreference("dark");

    expect(root.style.getPropertyValue("--boe-token-light-only")).toBe("");
    expect(root.style.getPropertyValue("--boe-token-shared")).toBe("#000");
    expect(root.style.getPropertyValue("--consumer-owned")).toBe("keep");
  });

  it("supports custom host metadata and can disable color-scheme writes", () => {
    const root = document.createElement("div");
    const controller = createThemeController({
      root,
      preference: "light",
      storageKey: null,
      mediaQueryList: null,
      themeAttribute: "data-test-theme",
      applyColorScheme: false,
    });

    controller.start();

    expect(root.getAttribute("data-test-theme")).toBe("light");
    expect(root.hasAttribute("data-theme")).toBe(false);
    expect(root.style.colorScheme).toBe("");
  });

  it("creates an early initialization script for SSR and static shells", () => {
    localStorage.setItem("early-theme", "dark");
    const script = createThemeInitializationScript({
      preference: "light",
      storageKey: "early-theme",
    });

    new Function(script)();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(script).toContain(DARK_MODE_MEDIA_QUERY);
  });
});
