import { registerBuiltInDesignProfiles } from "./built-ins.js";
import {
  applyDesignProfile,
  getDesignProfile,
} from "./registry.js";
import type {
  DesignProfileChangeDetail,
  DesignProfileController,
  DesignProfileControllerOptions,
} from "./types.js";

export const DESIGN_PROFILE_CHANGE_EVENT = "boe:design-profile-change";
export const DEFAULT_DESIGN_PROFILE_STORAGE_KEY = "boe-design-profile";

const resolveDefaultRoot = (): HTMLElement | null =>
  typeof document === "undefined" ? null : document.documentElement;

const resolveDefaultStorage = (): Storage | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

export const createDesignProfileController = (
  options: DesignProfileControllerOptions = {},
): DesignProfileController => {
  const profileAttribute = options.profileAttribute === undefined
    ? "data-design-profile"
    : options.profileAttribute;
  const storageKey = options.storageKey === undefined
    ? DEFAULT_DESIGN_PROFILE_STORAGE_KEY
    : options.storageKey;
  const shouldResolveDefaultStorage = options.storage === undefined;
  let root = options.root ?? null;
  let storage = options.storage ?? null;
  let profileName = options.profile ?? "box-default";
  let appliedVariables = new Set<string>();
  let started = false;

  const apply = (): void => {
    if (!root) {
      throw new Error("DesignProfileController requires a root HTMLElement");
    }
    if (!getDesignProfile(profileName)) {
      throw new Error(`Unknown design profile: ${profileName}`);
    }

    const nextVariables = new Set(applyDesignProfile(root, profileName));
    for (const variable of appliedVariables) {
      if (!nextVariables.has(variable)) {
        root.style.removeProperty(variable);
      }
    }
    appliedVariables = nextVariables;

    if (profileAttribute) {
      root.setAttribute(profileAttribute, profileName);
    }
    if (typeof CustomEvent !== "undefined") {
      root.dispatchEvent(
        new CustomEvent<DesignProfileChangeDetail>(DESIGN_PROFILE_CHANGE_EVENT, {
          bubbles: true,
          composed: true,
          detail: { profileName },
        }),
      );
    }
  };

  return {
    start() {
      if (started) {
        return;
      }
      root ??= resolveDefaultRoot();
      if (options.registerBuiltIns ?? true) {
        registerBuiltInDesignProfiles();
      }
      if (shouldResolveDefaultStorage) {
        storage = resolveDefaultStorage();
      }
      if (storage && storageKey) {
        try {
          const storedProfile = storage.getItem(storageKey);
          if (storedProfile && getDesignProfile(storedProfile)) {
            profileName = storedProfile;
          }
        } catch {
          // Storage may be unavailable in privacy-restricted or embedded contexts.
        }
      }
      started = true;
      apply();
    },
    stop() {
      if (!started || !root) {
        return;
      }
      for (const variable of appliedVariables) {
        root.style.removeProperty(variable);
      }
      appliedVariables.clear();
      if (profileAttribute) {
        root.removeAttribute(profileAttribute);
      }
      started = false;
    },
    setProfile(name) {
      profileName = name;
      if (started) {
        apply();
      }
      if (storage && storageKey) {
        try {
          storage.setItem(storageKey, name);
        } catch {
          // Storage may be unavailable in privacy-restricted or embedded contexts.
        }
      }
    },
    getProfile: () => profileName,
  };
};
