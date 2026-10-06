# Open issue reconciliation — 2026-10-06

Scope: the 19 open issues in `unofficialbox/box-open-elements` at the start of
this work. Implementation branch: `codex/open-enhancements-319-340`.

| Issues | Disposition | Evidence / remaining acceptance |
| --- | --- | --- |
| #319 | Implemented here | Combobox field-level description uses the shared form-field contract and `aria-describedby`; React wrapper exposes it, options, refs, and value events. |
| #320 | Already implemented in 0.26.0 | Host-authoritative `ProcessModel.validate` replaces generic split checks. Keep open until the Riptide host confirms its own conversion/checks behavior. |
| #321–324 | Library implementation in 0.26.0 | See [Process Modeler rebuild](./process-modeler-design-rebuild.md). Side-by-side product acceptance of canvas, routing, palette, and motion on real Riptide workflows remains. |
| #325–328 | Library implementation in 0.26.0 | Riptide still supplies its action catalog, domain fields, CEL validation, conversion/save gate, and run metrics. Library does not own those host concerns. |
| #329–331 | Library implementation in 0.26.0 | Embedded-host acceptance and a manual Safari/VoiceOver pass remain; automated axe and browser checks alone cannot close them. |
| #335 | Implemented here | Process Modeler status remains a polite live region but is visually clipped; cancellation stays an announcement, not page text. |
| #336 | Implemented here | Code Editor exposes syntax/surface CSS variables and `lineAt`/`lineStart`; Tab behavior was explicitly excluded by the issue. |
| #337 | Implemented here | Code Block accepts a region `label`; Call Console names its blocks “Request” and “Response.” |
| #338 | Implemented here | Active Command Palette shortcut uses the primary text token. Computed colors checked in light and dark. |
| #339 | Implemented here | React TextField forwards typed `type`, `reveal`, and `autocomplete`. |
| #340 | Implemented here | Opt-in `plain-panels` removes accordion and panel region landmarks while retaining heading/trigger semantics and focus. Default behavior is unchanged. |

Do not close the Process Modeler umbrella or host-dependent tickets based solely
on this library branch. The next acceptance step is a Riptide-side integration
review against the pinned design, followed by the manual assistive-technology
check recorded in the rebuild plan.
