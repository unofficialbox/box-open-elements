# @unofficialbox/box-open-elements-angular

Typed standalone Angular 20 directives for `box-open-elements`. Import
`Button`, `TextField`, `Select`, and `Dialog` in a standalone component to get
typed inputs, custom-event outputs, element access, and automatic registration.

```bash
npm install @unofficialbox/box-open-elements @unofficialbox/box-open-elements-angular @angular/core
```

```ts
import { Component } from "@angular/core";
import { Button, Select, TextField } from "@unofficialbox/box-open-elements-angular";

@Component({
  standalone: true,
  imports: [Button, Select, TextField],
  template: `<box-select [options]="options" (value-changed)="setStatus($event)" />`,
})
export class Example {
  options = [{ label: "Draft", value: "draft" }];
  setStatus(event: CustomEvent<{ value: string }>) {}
}
```

`createExplorerSelectionSignal(controller)` exposes the shared selection
controller as a scoped Angular signal. **Supported** as of `0.7.0`:
the first public lockstep adapter release, verified by a clean registry install.


## Native-named output compatibility

TextField/Select `value-changed` and Dialog `open-changed`, `confirm`, and `cancel`
keep their published names and `CustomEvent` types. Angular binds a native DOM
listener and an output subscription for these names. The adapter uses Angular's
public `getDebugNode(...).listeners` metadata to recognize a callback that
already has a DOM route and omits that callback only from the native relay.
Native observers and ordinary programmatic subscribers remain enabled. Explicit
`emit` and `next` calls still deliver through the output, including reentrant
calls during a native event. Delivery is not deduplicated by time or payload.
Button's native `(click)` remains unchanged.

Compatibility analysis considered output renaming/removal (would change published
contracts), dropping the relay (would break programmatic streams), a global event
manager filter (could suppress `Renderer2.listen` observers), and additive aliases
(would require template migration). None is required by the chosen routing fix;
existing templates and programmatic streams need no API migration. No Angular
private APIs or listener suppression are used.

The host reference used for route discovery is released at directive destruction;
caller-owned emitter subscriptions remain usable. Custom replacement emitters
retain their existing behavior. Browser validation uses standard Angular 20.3.27
DOM rendering in both development and production modes.

### Repeatable version compatibility gate

After `bun install --frozen-lockfile` and `bun run build:core`, run:

```sh
bun run frameworks:angular:compatibility 20.0.0
bun run frameworks:angular:compatibility 20.3.27
```

The dedicated Angular output compatibility CI matrix runs both commands. Each
creates a fresh temporary dependency tree with the exact Angular core, common,
compiler, compiler-cli and platform-browser versions and TypeScript 5.8.3. It
copies the current built core and adapter sources, compiles the adapter with that
version's `ngc`, then strictly compiles a real template consumer. It never links
the repository's `node_modules` or substitutes its pinned Angular compiler.

Development and production execution in JSDOM covers TextField/Select
`value-changed` and Dialog `open-changed`, `confirm` and `cancel`: original event
identity, repeated identical dispatches, native and Renderer2 observers,
programmatic subscribers, explicit `emit`/`next`, nested native and explicit
emissions, directive/template teardown, and caller-owned observer cleanup.
The isolated directory is retained with its package manifest, lockfile and
`REPORT.json`, and CI uploads that evidence. A failed install, compiler or
runtime assertion fails the gate. These two endpoints guard the declared 20.x
range; they do not establish compatibility for every intervening release or
custom renderer. Updating the pinned Angular version should also update this
matrix deliberately.

For optional real-browser validation, use the retained directories printed by the
runner with the repository's `playwright-core` and an installed browser:

```sh
node tools/adapters/angular-compatibility/browser.mjs chrome /path/to/chrome /tmp/boe-angular-20.0.0-... /tmp/boe-angular-20.3.27-...
node tools/adapters/angular-compatibility/browser.mjs firefox - /tmp/boe-angular-20.0.0-... /tmp/boe-angular-20.3.27-...
```

Firefox with `-` uses Playwright's installed executable. The replay checks both
modes at desktop/mobile widths, rejects external requests and browser errors,
and writes `angular-compatibility-<engine>.json` in the current directory.
If Node is outside PATH, the compiled runner accepts its executable as the
argument after the Angular version.
