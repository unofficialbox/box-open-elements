# Box design-fidelity reconciliation

Status: exhaustive audit complete; implementation is defined in [`plans/box-design-fidelity-reconciliation-execplan.md`](../../plans/box-design-fidelity-reconciliation-execplan.md).

Date: 2026-07-17

## Executive finding

The implementation is architecturally credible but visually not at Box production quality. Its colors often resemble Box, yet its CSS does not behave like one coherent design system. Modern Box colors, legacy `box-ui-elements` (BUE) geometry, browser defaults, and a locally invented soft-card aesthetic are mixed within the same catalog. That produces the amateur result called out in review: oversized and inconsistent radii, arbitrary rem values, gradients and glossy inset highlights, generic panel shells, weak hierarchy, placeholder iconography, and states that vary from component to component.

This is not a small active-state defect. It is a full-catalog reconciliation. Every registered foundation, component, and rendered pattern is accounted for below. “No direct analogue” does not mean “no work”; it means the surface must be derived from the shared Box grammar and the nearest production workflow rather than copied from a same-named BUE file.

## Evidence and source priority

1. The authenticated current Box web application is the oracle for current product appearance.
2. BUE at commit `c5e0f55a948f3ff2532d8012b60506784ebdfa2b` supplies component anatomy, behavior, and legacy SCSS precedent.
3. Local source and rendered catalog pages establish what this repository actually ships.

When BUE and the live product disagree, current Box wins for appearance. BUE remains the fallback for surfaces not exposed in the inspected Box workflow.

### Measured current-Box grammar

| Surface | Exact observed treatment |
| --- | --- |
| Quick search | `520×48px`; `12px` side / `44px` leading padding; white; `1px rgba(0,0,0,.12)`; `24px` radius; `0 0 8px rgba(0,0,0,.05)`; Lato `15/20` regular |
| Primary Share button | `102×40px`; `14/16px` horizontal padding; `#0061d5`; white; `20px` radius; Lato `16/24` bold; no shadow |
| Secondary New button | `94×40px`; white; `1px rgba(0,0,0,.12)`; `20px` radius; Lato `16/24` bold |
| Compact Copy button | `80×32px`; `10/12px` horizontal padding; white; `1px rgba(0,0,0,.12)`; `20px` radius; Lato `15/15` bold |
| Folder row | `56px` high; transparent rest; Lato `14/20`; `#4e4e4e`; hovered with `12px` radius and `0 1px 4px rgba(0,0,0,.1)` |
| Selected folder row | `#f2f7fd`; `#002756`; `12px` radius; blue rounded boundary; primary text bold |
| Selected tab | Transparent; dark bold label; brand underline |
| Action menu | `251px` wide; white; `1px #e8e8e8`; `20px` radius; `12px` padding; `0 1px 4px rgba(0,0,0,.1)`; Lato `15/20` |
| Action-menu item | `225×40px`; `6px` padding; transparent `2px` boundary; `12px` radius; Lato `15/20` |
| Share dialog | `480px` wide; white; `24px` radius; heading Lato `19/24` bold; close `40×40px`; separators `#e8e8e8` |
| Shared-link toggle | `44×24px`; brand fill; `40px` radius; `2px` inset |

These values reveal a role-based system, not one universal radius: controls are 32/40/48px, buttons are pill-shaped, list/menu items use 12px corners, and containing overlays use 20/24px corners. Surfaces are predominantly flat; shadows are sparse and shallow.

### Systemic local evidence

- 105 of 108 rendered catalog sources use raw `rem` geometry; only 48 import shared geometry.
- 30 sources use `linear-gradient`; 20 use literal-white mixes or highlights; 33 use raw `rgba()`; 47 use `999px` radii.
- Local geometry still specifies an 8px menu radius and 12px modal radius while current Box measures 20px and 24px respectively.
- The token registry types design systems as an unstructured `Record<string, string>` and exposes colors/fonts but no semantic typography, elevation, or role-based control geometry.
- The shipped dark theme is a local analogue, not a reference-verifiable Box theme; many components then break it with literal white blends.
- The default screenshot gallery captures mostly resting states and its own hardcoded shell can camouflage component defects.
- The density audit reports zero high/medium findings despite visible inconsistency. Its thresholds measure outliers, not Box fidelity.

## Foundations: complete reconciliation

| Foundation | Exact differences | Recommendation |
| --- | --- | --- |
| Design tokens | Modern core colors are good (`#0061d5`, `#222`, selected `#f2f7fd`), but the registry is `Record<string,string>` and omits semantic size, type, radius, elevation, and component-role tokens. Components compensate with raw rems and color mixes. | **P0:** define typed semantic primitives and roles: type styles, 4px spacing, 32/40/48 controls, button/item/overlay radii, border/elevation, row states, and on-color text. Keep current color names as compatible aliases. |
| Typography | **Slice 1a reconciled the base:** all 107 rendered hosts consume `--boe-token-font-family-base`; default/dark bundles use `InterVariable, Inter, Helvetica Neue, Helvetica, Arial, sans-serif`; docs and deterministic screenshots load the same pinned Inter Variable asset. Exact component sizes, weights, line heights, case, and tracking still vary because most components have not adopted semantic type roles. | **P0 remaining:** migrate component families to `boeType` roles and remove arbitrary type declarations. Preserve measured live Box role metrics while treating observed Lato as legacy source evidence, not a runtime fallback. |
| Theming | `box-defaults` approximates current Box; `box-dark` is explicitly invented. Literal `white`, `rgba`, and `color-mix(... white ...)` occur across components, so theme registration cannot actually control appearance. | **P1:** declare light Box the fidelity gate; label dark experimental until independently specified; prohibit literal theme colors in catalog CSS and add token-coverage tests. |
| Geometry | Shared values (`32/40px` controls, 4px spacing) are useful, but overlay `8px`/modal `12px` radii conflict with live Box `20px`/`24px`; many components ignore the module and use 0.55–1rem radii. | **P0:** replace mixed legacy constants with role tokens measured from current Box; migrate by family, not global search/replace. Use BUE geometry only where current Box has no evidence. |
| Motion | Generic 120/140/160/240ms durations exist, while individual components recreate DOM, hard-code transitions, or have no enter/exit motion. A single 140ms interactive value does not express overlay, disclosure, toast, or drag behavior. | **P1:** define role-specific motion recipes and preserve nodes across state changes; test reduced motion and actual interpolation. |
| Iconography | A strong generated Box icon inventory exists, but many rendered controls use text glyphs (`+`, `<`, `>`, `?`, gear-like characters) or bespoke CSS shapes. Illustration use is sparse and empty states look generic. | **P0:** require manifest icons for all product actions and Box illustrations for empty/education states; add icon sizing/alignment tokens and ban text glyphs in product controls. |
| Brand | The Inter font stack is now enforced at every rendered host, but uppercase letter-spaced micro-labels, generic analytics colors, rounded cards, and editorial-looking gallery typography still create a non-Box voice. | **P1:** codify sentence-case labels, Inter role styles, Box-neutral hierarchy, approved data colors, and illustration rules; remove local decorative voice. |
| Accessibility | Headless focus/keyboard helpers are sound, but consumption is inconsistent: some focus rings are faint, cancelled, or reused as selection; tooltip placement and tree-grid styling obscure interaction. | **P0:** make focus a separate high-contrast layer; add deterministic keyboard/state specimens and visual tests alongside semantic tests. |
| Catalog and visual gate | All 108 surfaces render, but gallery shells alter context and mostly show defaults. It cannot prove hover/focus/selected/disabled, real modal stacking, table density, or Box-host composition. | **P0:** add isolated and realistic Box-workflow specimens, forced state matrices, viewport variants, and reviewed live-reference screenshots with per-surface baseline ownership. |

## Components: complete reconciliation

### Actions

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `button` | BUE button families; live 32/40px pill buttons | Local radius is shared medium (6px), primary adds drop/inset shadows, and sizes/fonts mix 12px with shared 13px; live buttons are flat, 20px radius, Lato 15–16 bold. | **P0:** rebuild size/variant recipes from 32/40px live metrics, pill radii, flat fills, exact padding/type, and icon slots. |
| `button-group` | BUE `ButtonGroup.scss` | Local selected buttons use gradients, brand-mixed text, white inset highlights, and ambient shadows; BUE selection is flat neutral and connected. | **P0:** use flat connected controls, one outer boundary, correct first/last radii, dark selected text, and independent focus. |
| `icon-button` | BUE plain/close buttons; live close `40×40` | Local `1rem` icon in a 0.75rem-radius glossy control uses white inset highlights; glyph content is unconstrained. | **P0:** provide 32/40px circular/quiet roles, manifest icons, no gloss, and 2px visible focus. |
| `link-button` | BUE link/plain button | Local adds a 0.55rem rounded hit surface and 3px soft focus halo; this reads as a small chip rather than an inline action. | **P1:** separate inline link and quiet-button variants; use link typography/underline rules and role-sized focus treatment. |
| `menu` | BUE menu; live action menu | Shared legacy shell is 8px radius with 12px padding/shadow `0 4 12`; live is 20px radius, 12px padding, 1px `#e8e8e8`, shallow `0 1px 4px`. | **P0:** adopt current overlay geometry/elevation and viewport collision/anchoring. |
| `menu-item` | BUE menu; live `225×40` item | Local shared item is 32px-ish with 8px radius/padding and selected styling can be overwritten by hover/focus; live uses 40px, 6px padding, 12px radius, dark text. | **P0:** set exact 40px row anatomy, preserve selected surface through interaction, and use icon/check slots. |
| `segmented-control` | Current Box mode switches | Local 0.75/0.55rem radii, gradients, white inset highlights, and shadowed selected segment make it glossy. | **P1:** retain segmented semantics but flatten track/segment, use role tokens, and remove literal-white effects. |

### Collections

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `card` | BUE thumbnail card | Local generic card uses 0.7rem radius, inset white highlight, arbitrary 0.78/1.04rem type, and no Box file-thumbnail anatomy. | **P1:** split actionable file card from generic surface; use Box thumbnail, metadata, action-menu, selected, hover, and focus recipes. |
| `carousel` | BUE slide carousel | Local nests multiple 0.7–0.75rem glossy cards, five gradient/white-highlight uses, oversized text arrows, and pill indicators. | **P2:** adopt BUE anatomy with manifest chevrons, flat slides, clipped viewport, exact control placement, and accessible status. |
| `datalist-item` | BUE datalist item | Local 0.6rem card-like row and 10–22% brand mixes differ from live 40px/12px rows and canonical `#f2f7fd` selection. | **P0:** use 40px option-row recipe, direct selected token, dark text, and optional check/icon regions. |
| `draggable-list` | BUE draggable list | Local 0.6rem rounded rows, 0.5×0.65rem padding, text drag affordance, and limited drop-position feedback lack production drag polish. | **P1:** use manifest handle, exact row rhythm, lifted drag preview, insertion line, and keyboard reorder messaging. |
| `grid-view` | BUE grid view / Content Explorer | Local generic 0.7rem cards, 1.1rem titles, and no production thumbnail/status/action hierarchy differ from Box file grid. | **P0:** reconstruct file tiles from live/BUE anatomy, with selection boundary, hover actions, metadata truncation, and density variants. |
| `pagination` | BUE pagination feature | Local controls have 0.6rem radii, white inset highlight, and text-like previous/next buttons; size and disabled treatment are ad hoc. | **P1:** use compact flat 32px controls, manifest chevrons, current-page semantics, and exact count/range typography. |
| `tree` | BUE tree-like navigation | Local uses five gradients/white highlights, four unrelated radii, arbitrary 0.16–0.68rem spacing, and diluted/hardcoded hover. | **P0:** rebuild on 40px navigation rows, depth spacing, manifest disclosure/folder icons, canonical selected/current states, and no gloss. |
| `tree-grid` | ARIA treegrid / Box collections | Core grid parts are effectively unstyled: declared column/depth CSS variables are not consumed, so columns and indentation do not form; selected styling is only an inset stripe. | **P0:** implement actual CSS grid columns, hierarchy indentation, headers/cells, 56px content rows, row hover/selection, and sticky/focus behavior. |

### Feedback

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `alert` | BUE inline notice | Local `14px 10px` padding/6px radius and plain-text dismiss differ from BUE notice anatomy; icon/tone spacing is incomplete. | **P1:** port notice geometry and semantic icons; use manifest close, tokenized tone border/surface/text, and multiline rhythm. |
| `badge` | BUE badge/count badge | Local `10px` text with `2px 4px 3px` padding and 4px radius is close but lacks distinct count/status roles and verified minimum size. | **P2:** define count/status variants, 16/20px minimums, numeric alignment, and on-tone contrast. |
| `chip` | BUE label pill | Local universal `999px` chip has ad-hoc 0.28/0.35/0.7rem padding, brand tint/border, and no clear filter/tag/input role split. | **P1:** create semantic tag/filter/input-token recipes with exact height, icon/remove slots, selected state, and dark text. |
| `empty-state` | BUE empty view | Local rounded text/card composition and pill action lack the recognizable Box illustration, restrained measure, and production spacing. | **P0:** use Box illustration assets, standard heading/body/action stack, width limits, and context-specific messages. |
| `error-mask` | BUE error mask | Local generic centered panel uses shared 6px radius and 40px padding but lacks BUE illustration/action hierarchy and container-aware fill. | **P1:** port error-view anatomy and illustrations; support overlay/full-region modes with exact action spacing. |
| `help-text` | BUE field messages | Local includes a 999px decorative marker and 0.86/0.7rem type; hierarchy does not match inline field help/error text. | **P1:** make it a plain 13/20 message with semantic icon only when needed; align to field inset. |
| `nudge` | Box education/coachmark patterns | Local 0.65rem card plus pill elements and no anchored arrow resembles a generic promo card, not an in-product nudge. | **P2:** define anchored/inline variants, Box illustration/icon, compact type, dismiss/action anatomy, and placement. |
| `progress-bar` | BUE loading/progress | Local pill track is generic and labels use arbitrary 0.8/0.86rem values; determinate, indeterminate, and status states lack exact grammar. | **P1:** define 4/8px tracks, tokenized status colors, label/value layout, and reduced-motion indeterminate behavior. |
| `progress-ring` | Box loading indicators | Local label is uppercase-like 0.68rem with 0.08em tracking and computed rem sizing; it looks dashboard-generic. | **P2:** use fixed small/medium/large geometry, normal Box labels, exact stroke widths, and accessible value text. |
| `progress-steps` | Box task flows | Completed steps retain numbers, connectors are absent, and each 0.75rem-radius item reads as a card. | **P1:** add check icons and connecting lines; flatten list/card chrome and align horizontal/vertical step anatomy. |
| `skeleton` | BUE ghost | Local 0.5rem radius and shimmer mixed toward literal white are not shape/role aware and fail dark theming. | **P1:** expose text/avatar/thumbnail/row shapes, tokenized stops, and reduced-motion static fallback. |
| `spinner` | BUE loading indicator | Local track mixes brand with `white 82%`, uses 2.5px border and 0.86rem label; geometry is not shared. | **P1:** port BUE/Box size roles and neutral track token; align label and reduced motion. |
| `toast` | BUE notification | Local is a dark slab with hardcoded white/rgba, 0.75rem radius, no enter/exit animation, and a text-like dismiss control. | **P1:** adopt current notification anatomy, manifest icon/close, semantic surfaces, role motion, stacking, and timeout affordance. |

### Files

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `drop-zone` | BUE Content Uploader/droppable | Local 0.75rem rounded dashed card, glossy inset treatment, and generic copy lack uploader illustration, file-state progression, and live Box hierarchy. | **P1:** port uploader drop target anatomy, flat token surface, icon/illustration, drag-active/error/uploading states, and file constraints. |

### Forms

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `calendar` | BUE date picker | Local 0.55–0.7rem nested radii and custom 0.68/0.82/0.95rem type create a soft card; navigation uses text glyphs. | **P1:** port BUE date grid anatomy, manifest chevrons, compact 32px cells, flat shell, and strong brand selected-date exception. |
| `category-selector` | BUE category selector | Local pill tags, 0.84/0.86rem type, and soft 3px focus halo are visually generic; category hierarchy and selection affordance are weak. | **P1:** port category row/tree anatomy, exact indentation/icons, canonical selected row, and footer actions. |
| `checkbox` | BUE checkbox | Base indicator is close, but shared font/geometry and 2px radius are not integrated with field roles; surrounding groups overpaint selection. | **P0:** port exact indicator size/stroke/check glyph, error/disabled/indeterminate states, and keep selection on indicator. |
| `checkbox-group` | BUE checkbox group | Local wraps options in 0.55rem cards and paints checked containers; live/BUE checkboxes remain neutral rows with indicator-only selection. | **P0:** remove selected-card treatment, use normal labels/help/error spacing, and preserve clear focus. |
| `color-picker` | No direct BUE analogue | Local 0.7rem input/pill, uppercase micro-labels, generic native color well, and brand halo do not resemble Box form chrome. | **P2:** compose standard text field, 32px swatch trigger, tokenized palette popover, validation, and recent colors. |
| `combobox` | BUE select/datalist patterns | Local is essentially a 0.7rem rounded text field without production trigger/icon/menu integration. | **P0:** compose the standard field and 40px option menu, manifest chevron/search, active-descendant states, and live overlay geometry. |
| `date-field` | BUE date picker/input | Local 0.7rem gradient input and native/date-like behavior do not visually connect to the calendar; label style is local. | **P1:** use standard field geometry, calendar icon/button, parsed display, validation, and anchored Box calendar. |
| `dropdown` | BUE dropdown/select menu | Legacy 8px overlay geometry, 32px rows, and brand-blue selected text differ from live 20px shell/40px row/dark selection. | **P0:** use current menu shell/item recipes, direct selected token, checkmark, manifest chevron, and collision handling. |
| `dual-listbox` | BUE list-selection patterns | Local has 0.65–0.75rem nested radii, gradients/white highlights, independent panels, and small generic transfer controls. | **P1:** flatten panels, standardize rows, use manifest transfer icons, clear counts/selection, and Box field labels. |
| `multi-select` | BUE pill selector/dropdown | Local 0.75rem shell, 0.5rem menu, `0 12px 30px` shadow, brand selected text, and generic pills conflict with live overlay/row grammar. | **P0:** standard field + current menu, direct selected token/dark text, semantic input-token chips, and exact keyboard states. |
| `number-input` | BUE text input conventions | Local 0.7rem gradient field and browser-native spinner styling produce platform-dependent appearance. | **P1:** use standard field, localized numeric type, Box stepper controls or intentionally suppress native spinners, and error/help anatomy. |
| `radio-group` | BUE radio | Local 0.55rem option cards, pill radii, inset selected shadow, and full-card fill contradict indicator-only BUE selection. | **P0:** neutral option rows, exact radio indicator/dot, normal-case labels, and independent focus/error. |
| `range-slider` | No direct BUE analogue | It renders two vertically stacked independent ranges; there is no shared track or fill between thumbs. Value pills mix brand with literal white. | **P1:** build a true dual-thumb shared track with range fill, collision-safe values, exact geometry, and keyboard constraints. |
| `rating` | No direct BUE analogue | Local uppercase label, 1rem control radius, 0.95rem hit cells, raw empty-star rgba, and text star glyphs look bespoke. | **P2:** use manifest star icons, flat group, standard label/help text, neutral stroke token, and clear hover/selection/focus. |
| `fieldset` | Native/BUE field grouping | Local mostly relies on native semantics with 0.8/0.86rem type and no shared group spacing/error contract. | **P1:** standardize legend, description, required/error text, and child rhythm without adding card chrome. |
| `pill-cloud` | BUE label pills | Local uniform `999px` pills with 0.35×0.75rem padding have no clear semantic role, overflow policy, or selected grammar. | **P2:** align to tag/filter chip roles, exact heights, wrapping gaps, truncation, and selected/remove states. |
| `pill-selector-dropdown` | BUE pill selector dropdown | Local stacks 0.4–0.7rem radii, a `0 12px 30px` shadow, and custom pills/menu rather than BUE selector anatomy. | **P1:** use standard multi-select field, current menu shell, Box pills, and exact token/remove/overflow behavior. |
| `rich-text-input` | BUE Draft.js editor | Local 0.55–0.7rem nested radii, multiple gradients/white highlights, oversized editor shell, and text-glyph tools are far from BUE editor chrome. | **P1:** port toolbar grouping/icons, flat bordered editor, standard labels/errors, content typography, focus, and disabled/read-only states. |
| `search-field` | BUE search form; live quick search | Local ignores `SurfaceSearchSurface`, uses a gradient 0.7rem shell, uppercase label, 0.8rem type, and no magnifier; live is 48px, 24px radius, 15/20, leading icon. | **P0:** add compact and global-search roles; match live search exactly and use manifest search/clear icons. |
| `select` | BUE select field | Local 6px-ish radius, `5px 25px 5px 10px` padding, gradient, inset shadow, and hardcoded SVG stroke `#52606d` differ from flat Box fields. | **P0:** standard 40px flat field, tokenized manifest chevron, exact typography, focus/error/disabled states. |
| `slider` | Native range / Box controls | Local leaves track/thumb browser-default via `accent-color`; value pill mixes with literal white. Appearance varies by browser. | **P1:** own track, thumb, fill, tick, focus, disabled, and value geometry with semantic tokens. |
| `spin-button` | BUE input conventions | Local 2.25rem controls/4.5rem input, 0.7rem radius, and generic plus/minus text use off-grid rems and lack connected-control anatomy. | **P1:** compose a 40px field with 32/40px manifest-icon steppers, connected boundaries, limits, and repeat behavior. |
| `switch` | BUE toggle; live shared-link toggle | Local uses 6px track radius plus pill thumb, hardcoded shadows, 34% focus mix, and 0.9rem label; live is `44×24`, 40px radius, 2px inset. | **P0:** match live toggle geometry and flat states; tokenized disabled/focus and normal label typography. |
| `tag-input` | BUE pill selector/input | Local 0.7rem gradient field, uppercase label, ad-hoc 0.2–0.55rem token padding, and soft halos lack standard field/token rhythm. | **P1:** reuse field and input-token recipes, exact wrapping/overflow, manifest remove icon, and validation states. |
| `text-area` | BUE text area | Local 0.7rem radius, 0.45×0.7rem spacing, uppercase label, and gradient surface differ from flat Box fields. | **P0:** establish standard label/field/help/error recipe, flat surface, min heights, resize modes, and count treatment. |
| `text-field` | BUE text input | Local uses a decorative gradient and uppercase, 0.08em-tracked 700 label; current Box uses sentence-case restrained labels and flat fields. | **P0:** make this the canonical 40px field primitive with exact type, padding, border, focus, error, disabled, prefix/suffix. |
| `time-field` | BUE time input | Local repeats the 0.7rem gradient/uppercase-label language and lacks integrated clock/segment anatomy. | **P1:** base on canonical field, manifest clock, locale-aware segments, validation, and popover only if required. |

### Identity

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `avatar` | BUE avatar | Circular image/fallback is broadly aligned, but fallback typography/initial colors and presence/status overlays are not governed by shared role tokens. | **P1:** port BUE size/fallback/status recipes and image-loading behavior; verify 24/32/40/48 sizes. |
| `contact-datalist-item` | BUE contact datalist item | Local 0.6rem card row, 0.5×0.65rem padding, pill decoration, and brand-mixed state differ from 40px live option rows. | **P0:** reuse standard option-row anatomy with avatar, name/email hierarchy, direct selected token, and check state. |
| `persona` | BUE media/persona patterns | Local 0.6rem rounded container, pill metadata, arbitrary 0.75/0.94rem type, and white inset highlight make a mini-card. | **P1:** flatten to avatar + text stack, standard 14/20 and 12/16 roles, status/action slots, and truncation. |

### Layout

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `app-shell` | Live Box application | Local is a generic 0.75rem rounded panel with 0.65–1.1rem type; it lacks Box global nav, 224px selected nav, 48px search, toolbar, and detail-sidebar hierarchy. | **P0:** define real Box shell slots and measured chrome; keep it optional so embedded elements remain headless. |
| `divider` | BUE separators; live `#e8e8e8` | Local hairline is mostly correct but adds a 0.72rem label role with no measured Box precedent. | **P2:** use stroke token mapped to `#e8e8e8`; separate labeled divider only if a real workflow needs it. |
| `nav-sidebar` | BUE sidebar; live navigation | Local 0.5–0.7rem rounded rows and 0.86rem text differ from live `224×40`, 28px selected container, strong blue/white current state. | **P0:** implement 40px navigation rows, manifest icons, measured current/hover/focus, groups, collapse, and overflow. |
| `section` | Box settings/sidebar sections | Local uses ad-hoc 0.72/0.85/1.05rem type/spacing and uppercase eyebrow patterns with no Box role mapping. | **P1:** define section heading/body/action slots using semantic type and spacing; no decorative card by default. |
| `sidebar-toggle-button` | Live Box chrome | Local 2.1rem/0.6rem geometry and text/CSS chevron are off-grid; animation never runs because render replaces the button node. | **P1:** use 40px icon-button recipe, manifest icon, stable DOM, correct expanded/current states, and real motion. |
| `split-view` | Live file list + details sidebar | Local is only an unstyled separator; no pane surfaces, header/body hierarchy, sizing, collapse affordance, or responsive behavior. | **P0:** model live main/detail composition with tokenized divider, min/max widths, resizer/collapse, sticky regions, and mobile fallback. |

### Navigation

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `accordion` | BUE collapsible | Local uses 0.45–0.65rem nested radii, gradients, literal-white mixes, and inset highlights; it reads as stacked soft cards. | **P1:** port flat disclosure rows, manifest chevron, separator rhythm, correct expanded/focus states, and stable node motion. |
| `tabs` | BUE tab view; live Sharing/Details | Selection is correctly underline-based, but local helper effects/white highlights and later `box-shadow:none` can cancel keyboard focus. | **P0:** keep transparent 2px underline, match live 15/20 labels and spacing, remove gloss, and layer unmistakable focus. |

### Overlays

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `dialog` | BUE modal; live Share dialog | Local legacy modal is 460px, 12px radius, 30px padding; live is 480px, 24px radius, H2 19/24, close 40px, flat separators. | **P0:** adopt current dialog role tokens/anatomy, correct scrim, header/body/footer spacing, focus trap, stacking, and responsive sheet fallback. |
| `drawer` | BUE/content sidebar; live Details | Local reuses modal shadow/6px radius and minimal 4px padding; it lacks live sidebar header, tabs, section rhythm, divider, and viewport attachment. | **P0:** define anchored side panel geometry, width, header/close, scrolling body, footer, modal/nonmodal variants, and responsive behavior. |
| `popover` | BUE flyout/popper; live menus | Local inherits 8px legacy overlay shell and no complete placement/collision/arrow grammar; live containers use 20px radius and shallow shadow. | **P0:** share current overlay shell with menu, add anchoring/collision/arrow options, and role-specific padding. |
| `tooltip` | BUE tooltip | Tooltip is in normal layout flow rather than absolutely positioned, so opening it reflows content; no placement/collision logic; trigger is glossy and colors are hardcoded rgba. | **P0:** implement top-layer/portal positioning, 4 placements + collision, compact dark token surface, delay, arrow, and no layout shift. |

### Visuals

| Component | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `illustration` | BUE Box product illustrations | Asset inventory is useful, but local component adds 0.75rem card/pill chrome, white highlights, and generic caption treatment around artwork. | **P1:** render approved assets without decorative shell by default; define exact sizes, aspect handling, accessible labeling, and empty-state composition. |

## Patterns: complete reconciliation

### Content Explorer

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `content-explorer` | BUE Content Explorer; live Files | Local 0.55–0.65rem nested panels and 0.78–1.1rem type produce a generic dashboard; it lacks live 48px search, measured toolbar, 56px rows, sidebar integration, and nuanced hover/selection. | **P0:** reconstruct the visual shell around existing headless contracts from measured Box chrome; keep transport/controller boundaries unchanged. |
| `explorer-breadcrumbs` | BUE breadcrumbs; live folder breadcrumb | Local pill (`999px`) crumbs with 0.3×0.55rem padding and 0.85–0.92rem type differ from live plain breadcrumb/title hierarchy. | **P0:** use flat text links, manifest chevron, truncation/overflow menu, 21/32 title relationship, and correct current semantics. |
| `explorer-toolbar` | BUE toolbar; live folder toolbar | Local is a rounded panel with 0.55×0.65rem padding and 0.85/0.88rem type; live uses independent 32/40px pill buttons on a flat canvas. | **P0:** remove panel wrapper; compose standard button/search/view controls with live spacing and responsive overflow. |
| `explorer-list` | BUE item list; live file rows | Local rounded outer panel and 0.6rem rows use generic 0.78–0.9rem type; selected/hover can turn text brand blue. | **P0:** 56px rows, dark links/text, live hover elevation and selected boundary, exact metadata/action columns, and manifest file icons. |
| `explorer-table` | BUE tables; live file table | Local panel/table uses 0.25–0.6rem radii, 0.75–0.94rem type, and faint `0 1px 2px` shadow; row state/anatomy lacks live spacing and rounded boundary. | **P0:** match 56px rows, 14/20 type, column/header rhythm, hover/selected treatments, action reveal, resize/sort affordances, and horizontal fallback. |
| `explorer-items` | BUE item grid/list adapter | Adapter has little intrinsic CSS, so output quality depends on inconsistent child surfaces and does not enforce live empty/loading/error/state composition. | **P0:** keep adapter headless but define composition contracts/specimens for list, table, grid, skeleton, empty, error, and pagination. |
| `explorer-action-menu` | Live action menu | Local action trigger/menu uses 1rem type, blue 10–22px shadows and 12–18px overlay elevation; live is 40px items, 20px shell, `0 1px 4px` neutral shadow. | **P0:** replace bespoke blue elevation with shared live menu/icon-button recipes and complete keyboard/focus behavior. |

### Search

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `filter-bar` | BUE/Box search filters | Local wraps controls in a 12px-radius panel and pills, with 0.82/0.9rem type; current Box uses flat toolbar composition and role-sized controls. | **P1:** remove generic panel, compose standard filter chips/fields, overflow, clear-all, and applied-count behavior. |
| `search-results-header` | Box search results | Local generic rounded panel, 1.35rem heading, pills, and hardcoded primary `#fff` do not match Box page heading/action hierarchy. | **P1:** use page-heading type, flat layout, result/query summary, standard buttons, sort/view controls, and tokenized on-brand text. |
| `saved-view-picker` | Box saved searches/views | Local 1rem-ish card shell and 0.65rem item cards make saved views look like dashboard tiles rather than a compact selector/menu. | **P1:** use standard dropdown/menu rows, star/pin/action icons, canonical selected/current state, and compact management footer. |

### Item

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `item-form` | Box metadata/properties forms | Local generic 12px panel, pills, 0.82–0.95rem type, and nested card fields lack Box section/field/action rhythm. | **P1:** compose canonical fields in flat sections, exact labels/help/errors, sticky actions only where workflow proves it, and responsive columns. |
| `item-details-panel` | Live Details sidebar; BUE content sidebar | Local rounded card/pills and 1.1rem heading do not reproduce sidebar tabs, headers, 1px separators, metadata sections, or 40px actions. | **P0:** rebuild as live sidebar composition using drawer/tabs/section/persona primitives and loading/empty/error states. |
| `bulk-action-bar` | BUE/Box selection toolbar | Local 12px panel with pill count and 1.35rem value is oversized and dashboard-like; it is not anchored to selected rows or live toolbar geometry. | **P1:** use compact selection toolbar, exact count text, standard 32/40px actions, overflow, sticky placement, and clear-selection. |
| `preview-header` | BUE Content Preview; Box Preview | Local generic panel/pills and 1.15rem title lack preview dark/light chrome, file metadata, standard action icons, navigation, and fullscreen behavior. | **P0:** map exact Preview header anatomy and icon controls, title truncation, action overflow, navigation, and responsive modes. |

### Metadata

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `metadata-filter-builder` | BUE metadata query/filter | Local 12px panel, 0.55rem rows, pill actions, and generic fields lack production query grouping, operators, indentation, and validation hierarchy. | **P1:** compose canonical fields/menu rows, explicit AND/OR groups, Box icons, compact row geometry, errors, and read-only summary. |
| `metadata-inspector` | BUE metadata sidebar | Local simple 12px card and 0.55×0.65rem rows do not match live details-sidebar sections, field typography, edit controls, or template hierarchy. | **P0:** rebuild inside details panel with 14/20 values, subdued labels, separators, edit affordances, loading/errors, and permission states. |

### Share

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `share-panel` | Live Sharing sidebar | Local 12px card, pills, arbitrary 0.92/0.94rem type, and hardcoded blue mixes do not reproduce live tabs, collaborator rows, shared-link section, or 40px controls. | **P0:** rebuild from live sidebar anatomy with shared dialog/control primitives and permission-aware states. |
| `permission-matrix` | BUE permissions/share workflows | Local generic rounded table/cards, pill roles, white highlights, and wide checkbox padding do not match compact Box permission tables/menus. | **P1:** use standard table/option rows, concise role labels, disclosure/help, sticky header, and clear changed/error states. |
| `access-stats` | Box access stats | Local 0.95/0.7rem tiles, 0.9rem padding, 0.15rem gaps, color mixes, and 1.35rem metrics create generic dashboard cards. | **P2:** use flat sidebar metrics/rows, semantic type scale, direct tokens, exact counts, loading state, and no decorative tiles unless reference proves them. |
| `collaborator-avatars` | BUE collaborator avatars; live Sharing | Core overlap idea is aligned, but local generic circular stack lacks live overflow count/menu, tooltip/persona, role/status, and exact 24/32px geometry. | **P1:** use avatar size tokens, 2px surface rings, `+N` overflow menu, accessible names, and collaborator detail. |
| `presence` | BUE presence | Local pill dots/labels at 0.76/0.84rem are generic and disconnected from avatars/items; no production stacking/tooltip semantics. | **P1:** integrate status with avatar/persona, use Box presence colors/icons, compact overlap, tooltip, and stale/offline states. |
| `invite-collaborators-modal` | BUE invite modal; live Share dialog | Local 12px shell with `0 24px 60px` slate shadow, pills, generic fields, and 1.1rem title differs from live 480px/24px dialog and 40px controls. | **P0:** rebuild on current dialog, canonical tag input/permission menu, exact headings/separators/actions, validation, and invite states. |
| `unified-share-modal` | BUE Unified Share; live Share dialog | Local 12px shell, huge `0 24px 60px` shadow, segmented pill tabs, hardcoded Material red `#b3261e`, and white mixes conflict with live 24px flat dialog and underline/tab-less sections. | **P0:** reconstruct live share workflow, current dialog/toggle/buttons, tokenized Box errors, collaborator/link sections, and permission menus. |

### Preview

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `annotation-toolbar` | BUE/Box Preview annotations | Local rounded panel/pills, text tools, and generic focus outline do not match Preview icon toolbar grouping, active tools, colors, or placement. | **P1:** use manifest icons, 32/40px grouped tools, strong-fill active exception, tooltips, separators, and viewport anchoring. |
| `annotation-inspector` | Box Preview annotation sidebar | Local 12px card, pills, 1.1rem heading, and colored halo resemble a dashboard card, not a threaded sidebar. | **P1:** use details-sidebar anatomy, flat rows, author/time hierarchy, resolve/delete menus, selected annotation state, and scroll linking. |
| `annotation-thread` | Box Preview comment thread | Local selected state is mainly a focus-ring shadow; pill metadata and 12px card shell overdecorate the conversation. | **P1:** separate selected annotation surface from focus, use avatar/comment typography, separators, reply box, actions, and resolved state. |
| `preview-element` | BUE Content Preview; live Box Preview | Current rendered specimen is largely a blank white placeholder inside a rounded panel; it lacks real viewport chrome, document canvas, loading/error/unsupported states, and controls. | **P0:** make provider-backed preview the visual centerpiece; reproduce canvas/chrome/toolbar/sidebar/fullscreen states while preserving adapter contracts. |

### File Request

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `file-request-builder` | Box File Request builder | Local generic 12px card, pills, and 1.1rem heading lack the branded preview/editor split, form-field canvas, settings, and publish hierarchy. | **P1:** derive layout from actual File Request builder, reuse canonical fields/preview, standard actions, validation, and responsive editor/preview modes. |

### Task

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `task-assignment-panel` | BUE/Box tasks | Local rounded dashboard card, pills, arbitrary 0.78–1.1rem type, hardcoded white mixes, and generic avatar/action styling lack task form hierarchy. | **P1:** use flat sidebar/modal sections, canonical people/date/select fields, standard actions, assignee avatars, status/errors, and permissions. |
| `review-queue-item` | Box tasks/review queues | Local 12px card/pills, hardcoded blue avatar gradient, irregular 0.28/0.72/0.95rem spacing, and faint focus ring differ from file/task list rows. | **P1:** base on 56px collection row/card role, real thumbnail/avatar, status badge, due/assignee metadata, menu, and canonical states. |

### Governance

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `governance-panel` | Box Governance UI | Local generic 12px card, pills, 0.78–1.1rem type, and form-like rows do not reproduce retention/legal-hold classification, warnings, permissions, or audit hierarchy. | **P1:** derive from actual Governance surfaces; use flat sections, semantic notices, canonical fields/tables, policy status, locked states, and confirmation dialogs. |

### Insights

| Pattern | Reference | Exact differences | Recommendation |
| --- | --- | --- | --- |
| `metric-card` | No direct BUE analogue | Local 12px card, pill delta, 1.35rem metric, and generic layout look like a starter dashboard rather than Box analytics. | **P2:** establish an approved analytics grammar from current Box, semantic type/data colors, compact comparison, loading/empty/error, and no decorative shell by default. |
| `chart-panel` | No direct BUE analogue | Local 12px rounded panel, pills, 1.1/1.35rem headings, and six raw color uses have no reference-backed hierarchy. | **P2:** define chart container anatomy, title/legend/filter/export roles, approved palette, axes/tooltips, and responsive/accessible table alternative. |
| `bar-chart` | No direct BUE analogue | Local bars use generic multicolor fills and `0 10px 18px` colored shadows; this decorative depth is absent from Box’s flat grammar. | **P2:** remove colored elevation, use approved categorical palette, precise axes/labels/gridlines, hover/focus tooltip, and data table. |
| `line-chart` | No direct BUE analogue | Local panel/pills and 1.35rem emphasis dominate the data; bespoke legends/points and two raw colors are not tokenized or Box-validated. | **P2:** use approved line/axis/grid/point specs, restrained container, accessible series navigation, tooltip, and empty/loading states. |
| `donut-chart` | No direct BUE analogue | Local nested 12px/999px/0.65rem geometry and multiple 10–24px shadows create a glossy dashboard visual with no Box precedent. | **P2:** flatten chart, define ring/center/legend geometry and approved colors, accessible segment focus/tooltip, totals, and small-size fallback. |

## Headless pattern modules

These modules have no visual surface, so CSS/SCSS comparison is not applicable. They are still in scope because the visual patterns must not move presentation into transport or controller code.

| Module family | Difference | Recommendation |
| --- | --- | --- |
| Content Explorer selection, navigation, collection, action, and item adapters/controllers | No visual defect in the headless contracts; current adapters permit multiple visual shells with inconsistent anatomy. | Preserve contracts. Add documented visual-state inputs and realistic adapter specimens; keep CSS in components/adapters. |
| Share presence, invite, unified-share controllers/contracts | No CSS surface; the composed modals/panels, not the controllers, diverge visually. | Keep event/data contracts stable while rebuilding the view layer and adding loading/error/permission fixtures. |
| Preview provider/content adapters and annotation controllers | No CSS surface; the placeholder-looking preview is a provider/shell composition problem. | Preserve provider neutrality; add reference-grade fixtures for loading, rendered, unsupported, error, annotation, and fullscreen states. |
| Metadata, item, file-request, task, governance, search, and insights data contracts | No direct BUE visual comparison at contract level. | Do not add presentation fields merely to style the UI; expose semantic state/data and map it through shared visual primitives. |

## Reconciliation rules

1. Current Box geometry wins where measured; BUE fills only unobserved gaps.
2. Build role recipes before restyling individual elements: type, controls, fields, rows, navigation, overlays, panels, and status.
3. Flat token surfaces are the default. Gradients, literal-white highlights, and colored shadows require explicit reference evidence.
4. Keep selection, hover, focus, current, pressed, checked, loading, error, and disabled visually distinct.
5. Use generated Box icons and illustrations; never ship text glyphs as product iconography.
6. Patterns compose primitives. They must not invent a new card, field, button, menu, or type scale.
7. Each changed surface needs isolated state specimens and a realistic Box-workflow screenshot.

## Coverage proof

This document accounts for all 7 documented foundation pages plus the catalog/visual gate, all 72 registered components, all 36 registered rendered patterns, and the nonvisual headless pattern families. The audit is deliberately broader than the earlier 108-entry scoring snapshot: an entry is not considered reconciled merely because it renders, passes tests, or has no same-named BUE file.
