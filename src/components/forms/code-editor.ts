import { BaseElement } from "../../core/index.js";
import { basicSetup } from "codemirror";
import {
  Compartment,
  EditorSelection,
  EditorState,
  Prec,
  Transaction,
} from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, keymap, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { go } from "@codemirror/lang-go";
import {
  autocompletion,
  closeCompletion,
  startCompletion,
  type Completion,
  type CompletionSource,
} from "@codemirror/autocomplete";
import { closeSearchPanel } from "@codemirror/search";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export interface CodeProblem {
  /** One-based line and column positions. */
  line?: number;
  /** UTF-16 offsets; when supplied, these take precedence over line/column. */
  from?: number;
  to?: number;
  col?: number;
  endCol?: number;
  message: string;
  tone: "error" | "warning" | "info";
}
export type CodeCompletion = Completion;
export type CodeCompletionSource = CompletionSource;
export interface CodeHighlight { from: number; to: number; }
export interface CodeSelection {
  anchor: number;
  head: number;
}
export interface CodeLine { number: number; from: number; to: number; }

const openingBrackets = "([{", closingBrackets = ")]}";

/** Walk parsed bracket tokens, not raw text: strings and comments stay untouched. */
function bracketDecorations(view: EditorView): DecorationSet {
  const stack: { from: number; char: string; depth: number }[] = [];
  const tokens: { from: number; className: string }[] = [];
  const visible = (from: number) => view.visibleRanges.some(range => from >= range.from && from < range.to);
  const add = (from: number, className: string) => { if (visible(from)) tokens.push({ from, className }); };
  const tree = syntaxTree(view.state);
  tree.iterate({
    enter(node) {
      if (node.to !== node.from + 1 || !"()[]{}".includes(node.name)) return;
      const char = view.state.doc.sliceString(node.from, node.to);
      if (char !== node.name) return;
      const open = openingBrackets.indexOf(char);
      if (open !== -1) {
        stack.push({ from: node.from, char, depth: stack.length });
        return;
      }
      const close = closingBrackets.indexOf(char);
      if (close === -1) return;
      let match = stack.length - 1;
      while (match >= 0 && openingBrackets.indexOf(stack[match].char) !== close) match--;
      if (match === -1) { add(node.from, "boe-code-bracket-unmatched"); return; }
      for (const orphan of stack.splice(match + 1)) add(orphan.from, "boe-code-bracket-unmatched");
      const pair = stack.pop()!;
      const color = `boe-code-bracket-${(pair.depth % 3) + 1}`;
      add(pair.from, color);
      add(node.from, color);
    },
  });
  // An incomplete parse can end before the document does; avoid falsely
  // labeling an opening bracket unmatched until the rest has been parsed.
  if (tree.length >= view.state.doc.length)
    for (const orphan of stack) add(orphan.from, "boe-code-bracket-unmatched");
  return Decoration.set(tokens.sort((a, b) => a.from - b.from).map(({ from, className }) =>
    Decoration.mark({ class: className }).range(from, from + 1)));
}

const bracketColorsExtension = ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  constructor(view: EditorView) { this.decorations = bracketDecorations(view); }
  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state))
      this.decorations = bracketDecorations(update.view);
  }
}, { decorations: plugin => plugin.decorations });

/** Optional CodeMirror entrypoint. Import `code-editor`, not the root catalog. */
export class CodeEditor extends BaseElement {
  static readonly tagName = "box-code-editor";
  static get observedAttributes(): string[] {
    return ["bracket-colors", "current-line-style", "fill-height", "hide-help", "hide-problems", "language", "pass-keys", "readonly", "label", "value", "wrap"];
  }
  private valueInternal = "";
  private problemsInternal: readonly CodeProblem[] = [];
  private completionsInternal: readonly CodeCompletion[] = [];
  private view?: EditorView;
  private languageConfig = new Compartment();
  private readonlyConfig = new Compartment();
  private completionsConfig = new Compartment();
  private wrapConfig = new Compartment();
  private wrapIndentConfig = new Compartment();
  private highlightsConfig = new Compartment();
  private bracketColorsConfig = new Compartment();
  private passKeysConfig = new Compartment();
  private highlightsInternal: readonly CodeHighlight[] = [];
  private source?: CodeCompletionSource;
  private timer?: ReturnType<typeof setTimeout>;
  private pending = false;
  private syncing = false;
  private problemIndex = -1;
  private savedSelection: CodeSelection = { anchor: 0, head: 0 };
  private escapeUntil = 0;

  get value(): string {
    return this.valueInternal;
  }
  set value(value: string) {
    if (this.valueInternal === value) return;
    this.valueInternal = value;
    if (this.isRendered) this.update();
  }
  /** Host replacements are silent and excluded from the typing undo stack. */
  setValue(value: string, options: { addToHistory?: boolean } = {}): void {
    if (!options.addToHistory || !this.view) { this.value = value; return; }
    clearTimeout(this.timer); this.pending = false;
    this.syncing = true;
    try {
      this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.length, insert: value } });
      this.valueInternal = value;
    } finally { this.syncing = false; }
    this.syncProblems();
  }
  get wrap(): boolean { return this.hasAttribute("wrap"); }
  set wrap(value: boolean) { this.toggleAttribute("wrap", value); }
  get bracketColors(): boolean { return this.hasAttribute("bracket-colors"); }
  set bracketColors(value: boolean) { this.toggleAttribute("bracket-colors", value); }
  /** Space-separated CodeMirror key names reserved for the host, e.g. Mod-Enter Mod-s. */
  get passKeys(): string { return this.getAttribute("pass-keys") ?? ""; }
  set passKeys(value: string) { this.setAttribute("pass-keys", value); }
  private passKeysExtension() {
    const keys = [...new Set(this.passKeys.split(/\s+/).filter(key => /^(?:(?:Mod|Ctrl|Alt|Shift|Meta)-)+(?:[A-Za-z0-9]+|Enter|Space|Escape)$/.test(key)))];
    // Returning true prevents lower-priority editor commands, but CodeMirror
    // leaves propagation intact so window-level host shortcuts still receive it.
    return Prec.highest(keymap.of(keys.map(key => ({ key, run: () => true }))));
  }
  get currentLineStyle(): "fill" | "border" | "none" {
    const value = this.getAttribute("current-line-style");
    return value === "border" || value === "none" ? value : "fill";
  }
  set currentLineStyle(value: "fill" | "border" | "none") { this.setAttribute("current-line-style", value); }
  get hideHelp(): boolean { return this.hasAttribute("hide-help"); }
  set hideHelp(value: boolean) { this.toggleAttribute("hide-help", value); }
  get hideProblems(): boolean { return this.hasAttribute("hide-problems"); }
  set hideProblems(value: boolean) { this.toggleAttribute("hide-problems", value); }
  get fillHeight(): boolean { return this.hasAttribute("fill-height"); }
  set fillHeight(value: boolean) { this.toggleAttribute("fill-height", value); }
  get completionSource(): CodeCompletionSource | undefined { return this.source; }
  set completionSource(value: CodeCompletionSource | undefined) { this.source = value; if (this.isRendered) this.update(); }
  get highlights(): readonly CodeHighlight[] { return this.highlightsInternal.map(range => ({ ...range })); }
  set highlights(value: readonly CodeHighlight[]) { this.highlightsInternal = value.map(range => ({ ...range })); if (this.isRendered) this.update(); }
  private wrapIndentExtension() {
    return EditorView.decorations.of(view => {
      if (!this.wrap) return Decoration.none;
      const ranges = [];
      const seen = new Set<number>();
      for (const visible of view.visibleRanges) {
        const first = view.state.doc.lineAt(visible.from).number;
        const last = view.state.doc.lineAt(visible.to).number;
        for (let number = first; number <= last; number++) {
          const line = view.state.doc.line(number);
          if (seen.has(line.from)) continue;
          seen.add(line.from);
          const whitespace = line.text.match(/^[\t ]*/)?.[0] ?? "";
          const columns = Math.min(24, whitespace.replaceAll("\t", "    ").length);
          if (columns) ranges.push(Decoration.line({ attributes: {
            style: `padding-left:${columns}ch;text-indent:-${columns}ch`,
          } }).range(line.from));
        }
      }
      return Decoration.set(ranges, true);
    });
  }
  private highlightExtension() {
    return EditorView.decorations.of(view => {
      const doc = view.state.doc;
      const lines = new Set<number>();
      for (const range of this.highlightsInternal) {
        if (!Number.isFinite(range.from) || !Number.isFinite(range.to)) continue;
        const from = Math.max(0, Math.min(doc.length, range.from));
        const to = Math.max(from, Math.min(doc.length, range.to));
        for (let line = doc.lineAt(from).number; line <= doc.lineAt(Math.max(from, to - 1)).number; line++) {
          lines.add(doc.line(line).from);
        }
      }
      return Decoration.set([...lines].sort((a, b) => a - b).map(from =>
        Decoration.line({ class: "boe-code-highlight", attributes: { part: "highlight" } }).range(from),
      ));
    });
  }
  get language(): string {
    return this.getAttribute("language") ?? "typescript";
  }
  set language(value: string) {
    this.setAttribute("language", value);
  }
  get readonly(): boolean {
    return this.hasAttribute("readonly");
  }
  set readonly(value: boolean) {
    this.toggleAttribute("readonly", value);
  }
  get label(): string {
    return this.getAttribute("label") ?? "Code editor";
  }
  set label(value: string) {
    this.setAttribute("label", value);
  }
  get problems(): readonly CodeProblem[] {
    return this.problemsInternal;
  }
  set problems(value: readonly CodeProblem[]) {
    this.problemsInternal = [...value];
    this.problemIndex = -1;
    this.syncProblems();
  }
  get completions(): readonly CodeCompletion[] {
    return this.completionsInternal;
  }
  set completions(value: readonly CodeCompletion[]) {
    this.completionsInternal = [...value];
    if (this.isRendered) this.update();
  }
  get selection(): CodeSelection {
    return this.view
      ? {
          anchor: this.view.state.selection.main.anchor,
          head: this.view.state.selection.main.head,
        }
      : this.savedSelection;
  }
  set selection(value: CodeSelection) {
    const clamp = (offset: number) =>
      Math.max(
        0,
        Math.min(this.value.length, Number.isFinite(offset) ? offset : 0),
      );
    this.savedSelection = {
      anchor: clamp(value.anchor),
      head: clamp(value.head),
    };
    this.view?.dispatch({
      selection: EditorSelection.single(
        this.savedSelection.anchor,
        this.savedSelection.head,
      ),
      scrollIntoView: true,
    });
  }
  /** One-based line containing a UTF-16 document offset, including before mount. */
  lineAt(position: number): CodeLine {
    const doc = this.view?.state.doc ?? EditorState.create({ doc: this.value }).doc;
    const offset = Math.max(0, Math.min(doc.length, Number.isFinite(position) ? Math.floor(position) : 0));
    const { number, from, to } = doc.lineAt(offset);
    return { number, from, to };
  }
  /** Start offset of a one-based line; out-of-range lines clamp to the document. */
  lineStart(number: number): number {
    const doc = this.view?.state.doc ?? EditorState.create({ doc: this.value }).doc;
    const line = Math.max(1, Math.min(doc.lines, Number.isFinite(number) ? Math.floor(number) : 1));
    return doc.line(line).from;
  }
  revealLine(line: number, options: { center?: boolean; select?: boolean; focus?: boolean } = {}): void {
    if (!this.view) return;
    const target = this.view.state.doc.line(
      Math.max(1, Math.min(this.view.state.doc.lines, Math.floor(line) || 1)),
    );
    if (options.select !== false) this.selection = { anchor: target.from, head: target.from };
    if (options.center || options.select === false) this.view.dispatch({
      effects: EditorView.scrollIntoView(target.from, options.center ? { y: "center" } : {}),
    });
    if (options.focus !== false) this.view.focus();
  }
  focus(): void {
    this.view?.focus();
  }
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === "value") this.valueInternal = newValue ?? "";
    super.attributeChangedCallback(name, oldValue, newValue);
  }
  connectedCallback(): void {
    super.connectedCallback();
  }
  disconnectedCallback(): void {
    this.flushChange();
    this.savedSelection = this.selection;
    this.view?.destroy();
    this.view = undefined;
  }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>
      :host{display:flex;flex-direction:column;min-width:0;min-height:0;color:var(--boe-token-text-text,#222);font:inherit}
      :host([hidden]){display:none!important}
      [part=editor]{border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:8px;overflow:hidden;min-height:0;flex:1 1 auto}
      .cm-editor{background:var(--boe-code-background,var(--boe-token-surface-surface,#fff));color:var(--boe-code-foreground,var(--boe-token-text-text,#222))}
      [part=editor]:focus-within{box-shadow:0 0 0 3px var(--boe-token-surface-surface-brand,#0061d5)}
      .cm-editor.cm-focused{outline:none}
      .cm-scroller{max-height:var(--boe-code-editor-height,420px);min-height:160px;overflow:auto;font-family:var(--boe-code-font-family,monospace);font-size:var(--boe-code-font-size,14px);line-height:var(--boe-code-line-height,1.6)}
      .cm-editor .cm-scroller{line-height:var(--boe-code-line-height,inherit)!important}
      :host([fill-height]){height:100%}
      :host([fill-height]) [part=editor],:host([fill-height]) .cm-editor,:host([fill-height]) .cm-scroller{height:100%;max-height:none;min-height:0}
      .cm-gutters,.cm-panels{color:var(--boe-code-foreground,var(--boe-token-text-text,#222))!important;border-color:var(--boe-token-stroke-stroke,#ddd)!important}
      .cm-panels{background:var(--boe-token-surface-surface-secondary,#fbfbfb)!important}
      .cm-gutters{background:var(--boe-code-gutter-background,var(--boe-code-background,var(--boe-token-surface-surface,#fff)))!important;color:var(--boe-code-gutter,var(--boe-token-text-text,#222))!important;border-right:var(--boe-code-gutter-border,1px solid var(--boe-token-stroke-stroke,#ddd))!important;font-variant-numeric:tabular-nums}
      .cm-tooltip{background:var(--boe-code-popup-background,var(--boe-token-surface-surface-secondary,#fbfbfb))!important;color:var(--boe-code-popup-foreground,var(--boe-code-foreground,var(--boe-token-text-text,#222)))!important;border-color:var(--boe-code-popup-border,var(--boe-token-stroke-stroke,#ddd))!important}
      .cm-tooltip .cm-diagnostic,.cm-tooltip-autocomplete ul li{color:var(--boe-code-popup-foreground,var(--boe-code-foreground,var(--boe-token-text-text,#222)))}
      .cm-cursor{border-left-color:var(--boe-code-caret,var(--boe-token-text-text,#222))}
      .cm-activeLine,.cm-activeLineGutter{background:var(--boe-code-active-line,color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 12%,transparent))!important}
      :host([current-line-style=border]) .cm-activeLine{background:transparent!important;box-shadow:inset 0 1px var(--boe-code-current-line-border,var(--boe-token-stroke-stroke,#ddd)),inset 0 -1px var(--boe-code-current-line-border,var(--boe-token-stroke-stroke,#ddd))}
      :host([current-line-style=none]) .cm-activeLine{background:transparent!important}
      :host([current-line-style=border]) .cm-activeLineGutter,:host([current-line-style=none]) .cm-activeLineGutter{background:transparent!important}
      .cm-activeLineGutter{color:var(--boe-code-gutter-active,var(--boe-code-gutter,var(--boe-token-text-text,#222)))!important}
      .cm-selectionBackground,.cm-content ::selection{background:var(--boe-code-selection,color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 12%,transparent))!important}
      .boe-code-highlight{background:var(--boe-code-highlight-background,color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 10%,transparent))!important;box-shadow:inset var(--boe-code-highlight-bar-width,3px) 0 var(--boe-code-highlight-bar-color,var(--boe-token-surface-surface-brand,#0061d5))}
      :host([current-line-style=border]) .cm-activeLine.boe-code-highlight{box-shadow:inset var(--boe-code-highlight-bar-width,3px) 0 var(--boe-code-highlight-bar-color,var(--boe-token-surface-surface-brand,#0061d5)),inset 0 1px var(--boe-code-current-line-border,var(--boe-token-stroke-stroke,#ddd)),inset 0 -1px var(--boe-code-current-line-border,var(--boe-token-stroke-stroke,#ddd))}
      .cm-matchingBracket{background:var(--boe-code-matching-bracket,color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 15%,transparent))!important;color:inherit!important}
      .cm-selectionMatch{background:var(--boe-code-selection-match,var(--boe-code-search-match,color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 15%,transparent)))!important;color:inherit!important}
      .cm-content .boe-code-bracket-1,.cm-content .boe-code-bracket-1 *{color:var(--boe-code-bracket-1,var(--boe-code-keyword,var(--boe-token-surface-surface-brand,#0061d5)))!important}
      .cm-content .boe-code-bracket-2,.cm-content .boe-code-bracket-2 *{color:var(--boe-code-bracket-2,var(--boe-token-text-status-text-warning,#9a6500))!important}
      .cm-content .boe-code-bracket-3,.cm-content .boe-code-bracket-3 *{color:var(--boe-code-bracket-3,var(--boe-token-text-status-text-success,#138a58))!important}
      .cm-content .boe-code-bracket-unmatched,.cm-content .boe-code-bracket-unmatched *{color:var(--boe-code-bracket-unmatched,var(--boe-token-text-status-text-error,#b92340))!important}
      .cm-nonmatchingBracket{color:var(--boe-token-text-status-text-error,#b92340)!important}
      .cm-searchMatch{background:var(--boe-code-search-match,color-mix(in srgb,var(--boe-token-text-status-text-warning,#9a6500) 20%,transparent));outline:none}
      .cm-searchMatch-selected{background:var(--boe-code-search-match-selected,var(--boe-token-surface-surface-brand,#0061d5))!important;color:var(--boe-code-search-match-selected-foreground,var(--boe-token-text-text-on-brand,#fff))!important}
      .cm-tooltip-autocomplete ul li[aria-selected=true]{background:var(--boe-code-popup-selected-background,var(--boe-token-surface-surface-brand,#0061d5))!important;color:var(--boe-code-popup-selected-foreground,var(--boe-token-text-text-on-brand,#fff))!important}
      .cm-panels input,.cm-panels button,.cm-foldPlaceholder{background:var(--boe-token-surface-surface,#fff);color:var(--boe-token-text-text,#222);border:1px solid var(--boe-token-stroke-stroke,#ddd)}
      .cm-lintRange-error,.cm-lintRange-warning,.cm-lintRange-info{background-image:none;text-decoration-line:underline;text-decoration-style:wavy;text-decoration-thickness:1px;text-underline-offset:3px}
      .cm-lintRange-error,.cm-diagnostic-error{color:inherit;text-decoration-color:var(--boe-token-text-status-text-error,#b92340);border-left-color:var(--boe-token-text-status-text-error,#b92340)}
      .cm-lintRange-warning,.cm-diagnostic-warning{text-decoration-color:var(--boe-token-text-status-text-warning,#9a6500);border-left-color:var(--boe-token-text-status-text-warning,#9a6500)}
      .cm-lintRange-info,.cm-diagnostic-info{text-decoration-color:var(--boe-token-surface-surface-brand,#0061d5);border-left-color:var(--boe-token-surface-surface-brand,#0061d5)}
      .cm-lint-marker-error{background-image:radial-gradient(circle,var(--boe-token-text-status-text-error,#b92340) 45%,transparent 50%)!important}
      .cm-lint-marker-warning{background-image:radial-gradient(circle,var(--boe-token-text-status-text-warning,#9a6500) 45%,transparent 50%)!important}
      .cm-lint-marker-info{background-image:radial-gradient(circle,var(--boe-token-surface-surface-brand,#0061d5) 45%,transparent 50%)!important}
      [part=help],[part=problems]{font-size:13px;color:var(--boe-token-text-text-secondary,#666);margin:8px 0}
      [part=help][hidden],[part=toolbar][hidden]{display:none}
      [part=toolbar]{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      button{font:inherit;color:inherit;background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:8px;padding:8px;min-height:36px}
      button:focus-visible{outline:3px solid var(--boe-token-surface-surface-brand,#0061d5);outline-offset:2px}
      @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    </style><div part="editor"></div><p part="help" id="editor-help">Press Escape then Tab to leave the editor. Use Control-Space for suggestions.</p><div part="toolbar"><button type="button" data-direction="-1">Previous problem</button><button type="button" data-direction="1">Next problem</button><span part="problems" role="status" aria-live="polite"></span></div>`;
  }
  protected setupListeners(): void {
    this.shadowRoot!.querySelectorAll<HTMLButtonElement>(
      "button[data-direction]",
    ).forEach((button) =>
      button.addEventListener("click", () =>
        this.navigateProblem(Number(button.dataset.direction)),
      ),
    );
    // Keep the advertised escape hatch independent of completion/search keymaps.
    this.shadowRoot!.addEventListener(
      "keydown",
      (event) => {
        const key = event as KeyboardEvent;
        if (!(key.target as HTMLElement).closest(".cm-content")) return;
        if (key.ctrlKey && (key.code === "Space" || key.key === " ")) {
          key.preventDefault();
          key.stopPropagation();
          if (this.view && !this.readonly) startCompletion(this.view);
        } else if (key.key === "Escape") this.escapeUntil = Date.now() + 2000;
        else if (key.key === "Tab" && Date.now() <= this.escapeUntil) {
          this.escapeUntil = 0;
          const toolbar = this.shadowRoot!.querySelector<HTMLElement>("[part=toolbar]");
          const button = toolbar?.hidden
            ? null
            : toolbar?.querySelector<HTMLButtonElement>("button:not(:disabled)");
          const help = this.shadowRoot!.querySelector<HTMLElement>("[part=help]");
          const target = button ?? (help?.hidden ? null : help);
          // With embedded chrome hidden, let CodeMirror's Tab focus mode
          // hand focus to the browser. A hidden toolbar button cannot receive it.
          if (target) {
            key.preventDefault();
            key.stopPropagation();
            target.setAttribute("tabindex", "0");
            target.focus();
          }
        } else if (
          !key.ctrlKey &&
          !key.metaKey &&
          !key.altKey &&
          key.key !== "Shift"
        )
          this.escapeUntil = 0;
      },
      { capture: true },
    );
  }
  private languageExtension() {
    return this.language === "go"
      ? go()
      : javascript({ typescript: this.language === "typescript" });
  }
  private completionExtension() {
    if (this.source) return autocompletion({ override: [this.source] });
    return autocompletion({
      override: [
        (context) => {
          const word = context.matchBefore(/[\w$]+(?:\.[\w$]*)*/);
          if (!word && !context.explicit) return null;
          let from = word?.from ?? context.pos;
          // A full SDK name replaces its prefix; a method replaces only the
          // identifier after the receiver's dot (for example flow().st).
          if (
            word?.text.includes(".") &&
            !this.completionsInternal.some((option) =>
              option.label.startsWith(word.text),
            )
          ) {
            from += word.text.lastIndexOf(".") + 1;
          }
          return { from, options: [...this.completionsInternal] };
        },
      ],
    });
  }
  protected update(): void {
    if (!this.view) {
      this.view = new EditorView({
        parent: this.shadowRoot!.querySelector<HTMLElement>("[part=editor]")!,
        root: this.shadowRoot!,
        state: EditorState.create({
          doc: this.value,
          extensions: [
            basicSetup,
            lintGutter(),
            keymap.of([indentWithTab]),
            Prec.highest(
              keymap.of([
                {
                  key: "Escape",
                  run: (view) => {
                    closeCompletion(view);
                    closeSearchPanel(view);
                    view.setTabFocusMode(2000);
                    return true;
                  },
                },
              ]),
            ),
            this.languageConfig.of(this.languageExtension()),
            this.readonlyConfig.of([
              EditorState.readOnly.of(this.readonly),
              EditorView.editable.of(!this.readonly),
            ]),
            this.completionsConfig.of(this.completionExtension()),
            this.wrapConfig.of(this.wrap ? EditorView.lineWrapping : []),
            this.wrapIndentConfig.of(this.wrapIndentExtension()),
            this.highlightsConfig.of(this.highlightExtension()),
            this.bracketColorsConfig.of(this.bracketColors ? bracketColorsExtension : []),
            this.passKeysConfig.of(this.passKeysExtension()),
            syntaxHighlighting(
              HighlightStyle.define([
                {
                  tag: tags.controlKeyword,
                  color: "var(--boe-code-control,var(--boe-code-keyword,var(--boe-token-surface-surface-brand,#0061d5)))",
                },
                {
                  tag: [tags.keyword, tags.moduleKeyword, tags.definitionKeyword, tags.operatorKeyword],
                  color: "var(--boe-code-keyword,var(--boe-token-surface-surface-brand,#0061d5))",
                },
                {
                  tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
                  color: "var(--boe-code-function,var(--boe-token-surface-surface-brand,#0061d5))",
                },
                {
                  tag: [tags.typeName, tags.className, tags.namespace],
                  color: "var(--boe-code-type,var(--boe-token-surface-surface-brand,#0061d5))",
                },
                {
                  tag: tags.propertyName,
                  color: "var(--boe-code-property,var(--boe-token-text-text,#222))",
                },
                {
                  tag: [tags.variableName, tags.definition(tags.variableName)],
                  color: "var(--boe-code-variable,var(--boe-token-text-text,#222))",
                },
                {
                  tag: [tags.string, tags.special(tags.string)],
                  color: "var(--boe-code-string,var(--boe-token-text-status-text-success,#138a58))",
                },
                {
                  tag: [tags.number, tags.bool, tags.null, tags.atom],
                  color: "var(--boe-code-number,var(--boe-token-text-status-text-warning,#9a6500))",
                },
                {
                  tag: tags.comment,
                  color: "var(--boe-code-comment,var(--boe-token-text-text-secondary,#666))",
                  fontStyle: "var(--boe-code-comment-style,normal)",
                },
                {
                  tag: [tags.punctuation, tags.bracket, tags.operator, tags.separator],
                  color: "var(--boe-code-punctuation,var(--boe-token-text-text,#222))",
                },
              ]),
            ),
            EditorView.updateListener.of((update) => {
              if (update.selectionSet && !this.syncing && !update.startState.selection.eq(update.state.selection)) {
                const { anchor, head } = update.state.selection.main;
                this.dispatchEvent(new CustomEvent("selection-changed", { detail: { anchor, head }, bubbles: true, composed: true }));
              }
              if (update.docChanged && !this.syncing) {
                this.valueInternal = update.state.doc.toString();
                this.pending = true;
                clearTimeout(this.timer);
                this.timer = setTimeout(() => this.flushChange(), 200);
              }
            }),
            EditorView.domEventHandlers({
              blur: () => {
                this.flushChange();
                return false;
              },
            }),
          ],
        }),
      });
      this.selection = this.savedSelection;
    } else {
      this.syncing = true;
      try {
        if (this.view.state.doc.toString() !== this.value) {
          clearTimeout(this.timer);
          this.pending = false;
          this.view.dispatch({
            annotations: Transaction.addToHistory.of(false),
            changes: {
              from: 0,
              to: this.view.state.doc.length,
              insert: this.value,
            },
          });
        }
        this.view.dispatch({
          effects: [
            this.languageConfig.reconfigure(this.languageExtension()),
            this.readonlyConfig.reconfigure([
              EditorState.readOnly.of(this.readonly),
              EditorView.editable.of(!this.readonly),
            ]),
            this.completionsConfig.reconfigure(this.completionExtension()),
            this.wrapConfig.reconfigure(this.wrap ? EditorView.lineWrapping : []),
            this.wrapIndentConfig.reconfigure(this.wrapIndentExtension()),
            this.highlightsConfig.reconfigure(this.highlightExtension()),
            this.bracketColorsConfig.reconfigure(this.bracketColors ? bracketColorsExtension : []),
            this.passKeysConfig.reconfigure(this.passKeysExtension()),
          ],
        });
      } finally {
        this.syncing = false;
      }
    }
    this.view.contentDOM.setAttribute("aria-label", this.label);
    this.view.contentDOM.setAttribute("tabindex", "0");
    if (this.hideHelp) this.view.contentDOM.removeAttribute("aria-describedby");
    else this.view.contentDOM.setAttribute("aria-describedby", "editor-help");
    (this.shadowRoot!.querySelector('[part=help]') as HTMLElement).hidden = this.hideHelp;
    (this.shadowRoot!.querySelector('[part=toolbar]') as HTMLElement).hidden = this.hideProblems;
    this.syncProblems();
  }
  private flushChange(): void {
    clearTimeout(this.timer);
    if (!this.pending) return;
    this.pending = false;
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }
  private diagnostics(): Diagnostic[] {
    if (!this.view) return [];
    const doc = this.view.state.doc;
    return this.problems
      .filter(
        (problem) =>
          Number.isFinite(problem.from) || (Number.isInteger(problem.line) &&
          problem.line! >= 1 &&
          problem.line! <= doc.lines),
      )
      .map((problem) => {
        if (Number.isFinite(problem.from)) {
          const from = Math.max(0, Math.min(doc.length, Math.floor(problem.from!)));
          const to = Math.max(from, Math.min(doc.length, Number.isFinite(problem.to) ? Math.floor(problem.to!) : from + 1));
          return { from, to, message: problem.message, severity: problem.tone };
        }
        const line = doc.line(problem.line!);
        const column = Number.isFinite(problem.col) ? problem.col! : 1;
        const endColumn = Number.isFinite(problem.endCol)
          ? problem.endCol!
          : column + 1;
        const from = line.from + Math.max(0, Math.min(line.length, column - 1));
        const to = Math.max(from, Math.min(line.to, line.from + endColumn - 1));
        return { from, to, message: problem.message, severity: problem.tone };
      });
  }
  private syncProblems(): void {
    if (!this.view) return;
    const diagnostics = this.diagnostics();
    this.view.dispatch(setDiagnostics(this.view.state, diagnostics));
    this.shadowRoot!.querySelector("[part=problems]")!.textContent =
      `${diagnostics.length} problem${diagnostics.length === 1 ? "" : "s"}`;
    this.shadowRoot!.querySelectorAll<HTMLButtonElement>(
      "button[data-direction]",
    ).forEach((button) => (button.disabled = diagnostics.length === 0));
  }
  navigateProblem(direction: number): void {
    const diagnostics = this.diagnostics();
    if (!diagnostics.length) return;
    this.problemIndex =
      this.problemIndex < 0
        ? direction < 0
          ? diagnostics.length - 1
          : 0
        : (this.problemIndex + (direction < 0 ? -1 : 1) + diagnostics.length) %
          diagnostics.length;
    const problem = diagnostics[this.problemIndex];
    this.selection = { anchor: problem.from, head: problem.to };
    this.focus();
    this.shadowRoot!.querySelector("[part=problems]")!.textContent =
      `Problem ${this.problemIndex + 1} of ${diagnostics.length}: ${problem.message}`;
  }
}
CodeEditor.register();
