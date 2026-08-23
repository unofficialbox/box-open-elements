// @vitest-environment node

import { describe, expect, it } from "vitest";

import * as viaPackage from "@unofficialbox/box-open-elements/drawer";
import * as viaSource from "../../../src/components/overlays/drawer.js";
import * as buttonViaPackage from "@unofficialbox/box-open-elements/button";
import * as buttonViaSource from "../../../src/components/actions/button.js";
import * as tokens from "@unofficialbox/box-open-elements/foundations/tokens";
import * as selection from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

/**
 * The adapter tests must exercise the core in *this* tree, not the published
 * copy in node_modules.
 *
 * This is a guard rather than a nicety. Before `vitest.config.ts` resolved
 * these specifiers to `src`, a `packages/react` test importing the core got
 * whatever was last released — so while `box-drawer` was being rewritten to
 * stop relocating its host, the React test covering that exact behaviour was
 * running against the previous release's drawer and passing. Two different
 * classes, one stale, and nothing in the output said so.
 *
 * Identity is the assertion because it is the one that cannot be faked: if the
 * specifier resolved anywhere else, these would be distinct class objects even
 * when the source happened to be identical.
 */
describe("core package resolution", () => {
  it("resolves the bare-entry subpath to the workspace source", () => {
    expect(viaPackage.Drawer).toBe(viaSource.Drawer);
    expect(buttonViaPackage.Button).toBe(buttonViaSource.Button);
  });

  it("resolves the foundations subpath shape", () => {
    // `./foundations/*` maps to a directory index, unlike the bare entries.
    expect(typeof tokens.registerBoxDefaultDesignSystem).toBe("function");
  });

  it("resolves the nested pattern subpath shape", () => {
    // `./patterns/content-explorer/selection` is an explicit exports entry, and
    // deeper than the `./patterns/*` fallback — the resolver has to prefer the
    // directory index over the bare file for it.
    expect(Object.keys(selection).length).toBeGreaterThan(0);
  });
});
