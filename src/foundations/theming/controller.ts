import {
  applyDesignTokens,
  registerBoxDarkDesignSystem,
  registerBoxDefaultDesignSystem,
  setActiveDesignSystem,
} from "../tokens/index.js";

export const THEME_CHANGE_EVENT = "boe:theme-change";
export const DEFAULT_THEME_STORAGE_KEY = "boe-theme";
export const DARK_MODE_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

export interface ThemeChangeDetail {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  designSystemName: string;
}

export interface ThemeControllerOptions {
  root?: HTMLElement;
  preference?: ThemePreference;
  storageKey?: string | null;
  storage?: Storage | null;
  mediaQueryList?: MediaQueryList | null;
  lightDesignSystem?: string;
  darkDesignSystem?: string;
  registerBuiltIns?: boolean;
  themeAttribute?: string | null;
  applyColorScheme?: boolean;
}

export interface ThemeController {
  start(): void;
  stop(): void;
  toggle(): void;
  setPreference(preference: ThemePreference): void;
  getPreference(): ThemePreference;
  getResolvedTheme(): ResolvedTheme;
}

export interface ThemeInitializationScriptOptions {
  preference?: ThemePreference;
  storageKey?: string | null;
  themeAttribute?: string | null;
}

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

const resolveDefaultRoot = (): HTMLElement | null =>
  typeof document === "undefined" ? null : document.documentElement;

const resolveDefaultStorage = (): Storage | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

const resolveDefaultMediaQueryList = (): MediaQueryList | null =>
  typeof matchMedia === "function" ? matchMedia(DARK_MODE_MEDIA_QUERY) : null;

const safeStoredPreference = (
  storage: Storage | null,
  storageKey: string | null,
): ThemePreference | null => {
  if (!storage || !storageKey) {
    return null;
  }

  try {
    const value = storage.getItem(storageKey);
    return isThemePreference(value) ? value : null;
  } catch {
    return null;
  }
};

const persistPreference = (
  storage: Storage | null,
  storageKey: string | null,
  preference: ThemePreference,
): void => {
  if (!storage || !storageKey) {
    return;
  }

  try {
    storage.setItem(storageKey, preference);
  } catch {
    // Storage may be unavailable in privacy-restricted or embedded contexts.
  }
};

const escapeInlineScriptValue = (value: string): string =>
  JSON.stringify(value).replaceAll("<", "\\u003c");

export const createThemeInitializationScript = (
  options: ThemeInitializationScriptOptions = {},
): string => {
  const preference = options.preference ?? "system";
  const storageKey = options.storageKey === undefined
    ? DEFAULT_THEME_STORAGE_KEY
    : options.storageKey;
  const themeAttribute = options.themeAttribute === undefined
    ? "data-theme"
    : options.themeAttribute;

  return `(() => {
  const fallback = ${escapeInlineScriptValue(preference)};
  let preference = fallback;
  try {
    const stored = ${storageKey ? `localStorage.getItem(${escapeInlineScriptValue(storageKey)})` : "null"};
    if (stored === "light" || stored === "dark" || stored === "system") preference = stored;
  } catch {}
  const resolved = preference === "system"
    ? (typeof matchMedia === "function" && matchMedia(${escapeInlineScriptValue(DARK_MODE_MEDIA_QUERY)}).matches ? "dark" : "light")
    : preference;
  ${themeAttribute ? `document.documentElement.setAttribute(${escapeInlineScriptValue(themeAttribute)}, resolved);` : ""}
  document.documentElement.style.colorScheme = resolved;
})();`;
};

export const createThemeController = (
  options: ThemeControllerOptions = {},
): ThemeController => {
  const defaultPreference = options.preference ?? "system";
  const storageKey = options.storageKey === undefined
    ? DEFAULT_THEME_STORAGE_KEY
    : options.storageKey;
  const lightDesignSystem = options.lightDesignSystem ?? "box-default";
  const darkDesignSystem = options.darkDesignSystem ?? "box-dark";
  const themeAttribute = options.themeAttribute === undefined
    ? "data-theme"
    : options.themeAttribute;
  const shouldApplyColorScheme = options.applyColorScheme ?? true;

  let preference = defaultPreference;
  let resolvedTheme: ResolvedTheme = "light";
  let root = options.root ?? null;
  let storage = options.storage ?? null;
  let mediaQueryList = options.mediaQueryList ?? null;
  const shouldResolveDefaultStorage = options.storage === undefined;
  const shouldResolveDefaultMediaQuery = options.mediaQueryList === undefined;
  let started = false;
  let appliedVariables = new Set<string>();

  const resolveTheme = (): ResolvedTheme =>
    preference === "system"
      ? (mediaQueryList?.matches ? "dark" : "light")
      : preference;

  const emitThemeChange = (designSystemName: string): void => {
    if (!root || typeof CustomEvent === "undefined") {
      return;
    }

    root.dispatchEvent(
      new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, {
        bubbles: true,
        composed: true,
        detail: {
          preference,
          resolvedTheme,
          designSystemName,
        },
      }),
    );
  };

  const applyTheme = (): void => {
    if (!root) {
      throw new Error("ThemeController requires a root HTMLElement");
    }

    resolvedTheme = resolveTheme();
    const designSystemName = resolvedTheme === "dark"
      ? darkDesignSystem
      : lightDesignSystem;
    setActiveDesignSystem(designSystemName);
    const nextVariables = new Set(applyDesignTokens(root, designSystemName));

    for (const variable of appliedVariables) {
      if (!nextVariables.has(variable)) {
        root.style.removeProperty(variable);
      }
    }

    appliedVariables = nextVariables;

    if (themeAttribute) {
      root.setAttribute(themeAttribute, resolvedTheme);
    }
    if (shouldApplyColorScheme) {
      root.style.colorScheme = resolvedTheme;
    }

    emitThemeChange(designSystemName);
  };

  const handleSystemThemeChange = (): void => {
    if (started && preference === "system") {
      applyTheme();
    }
  };

  const start = (): void => {
    if (started) {
      return;
    }

    root ??= resolveDefaultRoot();
    if (shouldResolveDefaultStorage) {
      storage = resolveDefaultStorage();
    }
    if (shouldResolveDefaultMediaQuery) {
      mediaQueryList = resolveDefaultMediaQueryList();
    }

    if (!root) {
      throw new Error("ThemeController cannot start without a document root");
    }

    if (options.registerBuiltIns ?? true) {
      registerBoxDefaultDesignSystem();
      registerBoxDarkDesignSystem();
    }

    preference = safeStoredPreference(storage, storageKey) ?? defaultPreference;
    mediaQueryList?.addEventListener("change", handleSystemThemeChange);
    started = true;
    applyTheme();
  };

  const stop = (): void => {
    if (!started) {
      return;
    }

    mediaQueryList?.removeEventListener("change", handleSystemThemeChange);
    started = false;
  };

  const setPreference = (nextPreference: ThemePreference): void => {
    if (!isThemePreference(nextPreference)) {
      throw new Error(`Unknown theme preference: ${String(nextPreference)}`);
    }

    preference = nextPreference;
    persistPreference(storage, storageKey, preference);
    if (started) {
      applyTheme();
    }
  };

  return {
    start,
    stop,
    toggle: () => setPreference(resolvedTheme === "dark" ? "light" : "dark"),
    setPreference,
    getPreference: () => preference,
    getResolvedTheme: () => resolvedTheme,
  };
};
