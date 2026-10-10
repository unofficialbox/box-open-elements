/** Riptide Diagram anatomy expressed through public Box Open Elements tokens. */
export const processModelerDesign = `
  :host([hidden]), [hidden] { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }
  button, input, textarea, select { font: inherit; color: inherit; }
  button { min-height: 36px; padding: 8px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 8px; background: var(--boe-token-surface-surface, #fff); cursor: pointer; }
  button:disabled { opacity: .5; cursor: default; }
  :is(button,input,textarea,select,[part=canvas],[part=minimap],[part=box],[part=frame]):focus-visible { outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset: 2px; }
  :host {
    display: block;
    position: relative;
    isolation: isolate;
    min-width: 0;
    --boe-process-box-edge: color-mix(in srgb, var(--boe-token-text-text, #141413) 55%, var(--boe-token-surface-surface, #fff));
    color: var(--boe-token-text-text, #141413);
    background: var(--boe-token-surface-surface, #fff);
    font: 14px/1.5 var(--boe-token-font-family-base, Inter, sans-serif);
  }
  [part=sr-only], [part=status], [part=urgent-status] { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  [part=toolbar] {
    min-height: 56px;
    margin: 0;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: nowrap;
    border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
    background: var(--boe-token-surface-surface, #fff);
  }
  [part=toolbar] button, [part=controls] button, [part=selection-toolbar] button {
    min-height: 30px;
    padding: 4px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    font-size: 13px;
    font-weight: 600;
  }
  [part=toolbar] svg, [part=controls] svg { width: 16px; height: 16px; display: block; }
  [part=toolbar] [data-command=undo], [part=toolbar] [data-command=redo], [part=controls] button:not([data-command=reset]) { width: 30px; height: 30px; padding: 6px; display: grid; place-items: center; }
  [part=controls] [data-command=snap][aria-pressed=true], [part=controls] [data-command=lock][aria-pressed=true] { background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #fff)); color: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=toolbar] button:hover, [part=controls] button:hover, [part=selection-toolbar] button:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }
  [part=toolbar] [data-command=tidy] { border-color: var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 18px; }
  [part=view-switch] { display: flex; gap: 2px; padding: 3px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 20px; }
  [part=view-switch] button { border-radius: 16px; }
  [part=view-switch] button[aria-pressed=true] { border-color: var(--boe-token-stroke-stroke, #e8e8e8); background: var(--boe-token-surface-surface, #fff); }
  [part=run-toggle] { display: flex; align-items: center; gap: 8px; white-space: nowrap; font-size: 13px; font-weight: 600; cursor: pointer; }
  [part=run-toggle] input { appearance: none; position: relative; width: 32px; height: 18px; margin: 0; border: 0; border-radius: 9px; background: var(--boe-token-surface-surface-hover, #f4f4f4); cursor: pointer; transition: background var(--boe-profile-motion-interactive, 200ms) ease-out; }
  [part=run-toggle] input::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--boe-token-surface-surface, #fff); box-shadow: 0 1px 2px rgb(0 0 0 / .25); transition: transform var(--boe-profile-motion-interactive, 200ms) ease-out; }
  [part=run-toggle] input:checked { background: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=run-toggle] input:checked::after { transform: translateX(14px); }
  [part=run-toggle] input:focus-visible { outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset: 2px; }
  [part=toolbar] [data-command=checks-status] { white-space: nowrap; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=toolbar] [data-command=checks-status][data-state=bad] { color: color-mix(in srgb, var(--boe-token-text-status-text-error, #b92340) 85%, var(--boe-token-text-text, #141413)); }
  [part=toolbar] [data-command=checks-status][data-state=ready] svg { flex: none; color: var(--boe-token-text-status-text-success, #187657); }
  [part=view-menu] { display: none; position: relative; }
  [part=view-menu] summary { list-style: none; height: 32px; display: flex; align-items: center; padding: 0 14px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: .01em; cursor: pointer; white-space: nowrap; }
  [part=view-menu][open] { z-index: 20; }
  [part=view-menu-options] { position: absolute; z-index: 20; top: calc(100% + 4px); right: 0; width: 200px; max-width: calc(100vw - 24px); padding: 6px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 10px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=view-menu] button { display: flex; justify-content: space-between; gap: 16px; width: 100%; min-height: 32px; padding: 0 10px; text-align: start; background: transparent; }
  [part=view-menu] small { color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=view-menu] [role=separator] { border-top: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); margin: 4px 2px; }
  [part=toolbar-document] { display: flex; align-items: baseline; gap: 10px; min-width: 0; flex: 1 1 auto; visibility: hidden; }
  [part=toolbar-title] { font-size: 15px; font-weight: 650; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  [part=toolbar-document] span { font-size: 12px; white-space: nowrap; }
  [part=toolbar-actions] { display: flex; align-items: center; gap: 8px; }
  [part=toolbar] button:not([role]) { height: 32px; min-height: 32px; padding: 0 14px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: .01em; white-space: nowrap; }
  [part=toolbar] [part=view-switch] { padding: 2px; gap: 0; background: var(--boe-token-surface-surface-secondary, #fbfbfb); }
  [part=toolbar] [part=view-switch] button { height: 26px; min-height: 26px; padding: 0 12px; border: 0; border-radius: 16px; font-size: 12.5px; letter-spacing: normal; }
  [part=toolbar] [part=view-switch] button[aria-pressed=true] { box-shadow: 0 0 0 1px var(--boe-token-stroke-stroke, #e8e8e8); }
  [part=toolbar] button[data-command=checks-status] { display: inline-flex; align-items: center; gap: 6px; height: auto; min-height: 0; padding: 4px 6px; border: 0; border-radius: 8px; font-weight: 400; letter-spacing: normal; }
  [part=toolbar] [data-command=palette], [part=toolbar] [data-command=undo], [part=toolbar] [data-command=redo] { width: 32px; padding: 0; place-items: center; }
  [part=toolbar] [data-command=palette], [part=toolbar] [data-command=details] { border-color: var(--boe-token-stroke-stroke, #e8e8e8); background: var(--boe-token-surface-surface, #fff); }
  :host([data-compact-toolbar]) [part=view-switch], :host([data-compact-toolbar]) [part=run-toggle] { display: none; }
  :host([data-compact-toolbar]) [part=view-menu] { display: block; }
  [part=layout] {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr) 320px;
    gap: 0;
    min-height: 0;
    height: var(--boe-process-height, 660px);
    overflow: hidden;
  }
  [part=pane-drawer] { display: contents; color: inherit; }
  [part=canvas-stack] { display: grid; grid-template-rows: auto minmax(0, 1fr); min-width: 0; min-height: 0; }
  /* The hidden hold leaves row 1 empty. Keep the canvas in the flexible row
     explicitly; auto-placement otherwise puts its absolute world in a 0px row. */
  [part=canvas-stack] > [part=hold] { grid-row: 1; }
  [part=canvas-stack] > [part=canvas] { grid-row: 2; }
  [part=insert-chooser]::backdrop { background: rgb(0 0 0 / .45); }
  [part=pane-scrim] { position: absolute; inset: 0; z-index: 30; background: rgb(0 0 0 / .45); }
  [part=pane-title], [part=pane-close], [data-command=palette], [data-command=details] { display: none; }
  [part=palette], [part=inspector] {
    min-width: 0;
    overflow: auto;
    padding: 12px;
    border: 0;
    border-radius: 0;
    background: var(--boe-token-surface-surface, #fff);
  }
  [part=palette] { display: flex; flex-direction: column; gap: 12px; border-right: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); }
  [part=palette-heading] { margin: 0 4px; font-size: 14px; font-weight: 650; line-height: 20px; }
  [part=skip-link] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  [part=skip-link]:focus-visible { position: static; width: auto; height: auto; clip-path: none; }
  [part=inspector] { border-left: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); padding: 16px 0; }
  [part=palette] label { font-size: 0; position: relative; }
  [part=search-icon] { position: absolute; left: 12px; top: 9px; width: 18px; height: 18px; color: var(--boe-token-text-text-secondary, #6f6f6f); pointer-events: none; }
  [part=palette] input {
    width: 100%; min-width: 0;
    height: 36px;
    padding: 0 12px 0 36px;
    border: 1px solid transparent;
    border-radius: 24px;
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    font-size: 13px;
  }
  [part=palette] input:focus-visible { border-color: var(--boe-token-surface-surface-brand, #0061d5); background: var(--boe-token-surface-surface, #fff); }
  [part=choices] { display: grid; align-content: start; gap: 4px; max-height: none; overflow: visible; }
  [part=group] { margin: 4px 4px 6px; font-size: 12px; line-height: 1.45; font-weight: 650; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=choice] {
    display: grid; grid-template-columns: 20px minmax(0,1fr); gap: 0 10px;
    min-height: 44px; padding: 8px 10px; border: 1px solid transparent; border-radius: 10px;
    text-align: start; background: transparent; cursor: grab; touch-action: none;
  }
  [part=choice]:hover { border-color: var(--boe-token-stroke-stroke, #e8e8e8); background: var(--boe-token-surface-surface-hover, #f4f4f4); }
  [part=choice-icon] { grid-row: span 2; width: 20px; height: 20px; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=choice][data-tone=accent] [part=choice-icon] { color: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=choice-icon] svg { width: 20px; height: 20px; }
  [part=choice-name] { font-size: 13px; font-weight: 600; line-height: 1.45; }
  [part=choice-description] { grid-column: 2; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12px; line-height: 1.35; }
  [part=palette-hint] { margin: 4px; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12px; line-height: 1.45; }
  [part=canvas] {
    position: relative; min-width: 0; height: 100%; overflow: hidden;
    border: 0; border-radius: 0;
    background-color: var(--boe-token-surface-surface-secondary, #fbfbfb);
    background-image: radial-gradient(circle, color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 26%, transparent) 1px, transparent 1.2px);
    background-size: 12px 12px;
    touch-action: none; user-select: none; cursor: grab;
  }
  [part=canvas][data-panning] { cursor: grabbing; }
  [part=hold] { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 16px; border-bottom: 1px solid color-mix(in srgb, var(--boe-token-text-status-text-warning, #9a6b00) 45%, var(--boe-token-stroke-stroke, #e8e8e8)); background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #ffc447) 14%, var(--boe-token-surface-surface, #fff)); color: var(--boe-token-text-status-text-warning, #6b4a00); font-size: 13px; }
  [part=hold-text] { flex: 1 1 280px; min-width: 0; }
  [part=hold] button { min-height: 28px; padding: 3px 8px; border: 1px solid currentColor; border-radius: 6px; background: transparent; font-size: 12px; font-weight: 650; white-space: nowrap; }
  [part=world] { position: absolute; inset: 0; transform-origin: 0 0; }
  [part=lines] { position: absolute; inset: 0; width: 1px; height: 1px; overflow: visible; pointer-events: none; z-index: 3; }
  [part=line] { stroke: var(--boe-token-text-text-secondary, #6f6f6f); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }
  [part=line][data-selected=true] { stroke: var(--boe-token-surface-surface-brand, #0061d5); stroke-width: 2; }
  [part=line][data-drop=true] { stroke: var(--boe-token-surface-surface-brand, #0061d5); stroke-width: 2.5; stroke-dasharray: 6 4; }
  [part=line-hit] { fill: none; stroke: transparent; stroke-width: 24; pointer-events: stroke; }
  [part=connection-preview] { fill: none; stroke: var(--boe-token-surface-surface-brand, #0061d5); stroke-width: 2.5; stroke-dasharray: 6 4; }
  [part=pinned-end] { fill: var(--boe-token-surface-surface-brand, #0061d5); pointer-events: none; }
  [part=box], [part=frame] {
    position: absolute; touch-action: none; text-align: start; z-index: 4; display: grid; grid-template-columns: 20px minmax(0,1fr); align-content: center;
    gap: 2px 10px; min-width: 0; min-height: 64px; padding: 11px 12px;
    border: 1px solid var(--boe-process-box-edge, var(--boe-control-edge, #858585));
    border-radius: 8px; background: var(--boe-token-surface-surface, #fff);
    font-size: 13px; line-height: 1.3;
    transition: border-color var(--boe-profile-motion-interactive, 200ms) ease-out,
      background var(--boe-profile-motion-interactive, 200ms) ease-out;
  }
  [part=box][data-shape=task] { align-content: normal; font-size: 14px; line-height: 1.45; }
  [part=box][data-shape=task] > [part=icon] { grid-row: span 4; margin-top: 1px; }
  [part=box]:hover, [part=frame]:hover { border-color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [data-connect-target=true][data-connect-invalid=true] { border-color: var(--boe-token-text-status-text-error, #b92340) !important; }
  [part=connection-preview][data-invalid=true] { stroke: var(--boe-token-text-status-text-error, #b92340); }
  [data-connect-target=true] { border-color: var(--boe-token-surface-surface-brand, #0061d5) !important; }
  [part=box] strong, [part=frame] strong { overflow-wrap: anywhere; }
  [part=box] strong, [part=frame] strong { font-size: 13.5px; font-weight: 650; line-height: 1.3; }
  [part=box] small, [part=frame] small { grid-column: 2; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12.5px; line-height: 1.35; }
  [part=technical-description] { font: 12px/1.4 ui-monospace, 'SF Mono', Menlo, Consolas, monospace !important; overflow-wrap: anywhere; }
  [part=metrics] { grid-column: 2; display: flex; gap: 6px; flex-wrap: wrap; margin-top: 3px; font-size: 12px; line-height: 1.45; font-variant-numeric: tabular-nums; }
  [part=metrics][data-state=unmeasured] { color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=metric-separator] { color: var(--boe-token-text-text-tertiary, #767676); }
  [part=technical-summary] { overflow-wrap: anywhere; }
  [part=technical-inline-code] { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
  [part=metric-warning] { color: var(--boe-token-text-status-text-warning, #8a5800); }
  [part=icon] { grid-row: span 3; width: 20px; height: 20px; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=icon] svg { display: block; width: 20px; height: 20px; }
  [data-tone=accent] > [part=icon] { color: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=box][aria-current=true], [part=frame][aria-current=true] {
    border: 1px solid var(--boe-token-surface-surface-brand, #0061d5);
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 7%, var(--boe-token-surface-surface, #fff));
  }
  [data-invalid=true] { border-color: var(--boe-token-text-status-text-error, #b92340) !important; }
  [part=problem] { grid-column: 1 / -1; color: var(--boe-token-text-status-text-error, #b92340); font-size: 12px; }
  [part=frame] { z-index: 1; align-content: start; border-radius: 12px; background: color-mix(in srgb, var(--boe-token-surface-surface, #fff) 78%, transparent); }
  [part=frame] small { grid-column: 2; }
  [part=loop-mark] { position: absolute; right: 12px; bottom: 8px; font-size: 20px; line-height: 1; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=frame][data-palette-drop=true] { border-color: var(--boe-token-surface-surface-brand, #0061d5); box-shadow: 0 0 0 2px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent); }
  [part=frame-resize] { position: absolute; right: -12px; bottom: -12px; z-index: 8; width: 28px; height: 28px; min-height: 28px; padding: 0; border: 0; border-radius: 8px; background: var(--boe-token-surface-surface, #fff); box-shadow: 0 0 0 1px var(--boe-process-box-edge, #858585); cursor: nwse-resize; }
  [part=frame-resize]::before { content: ''; position: absolute; right: 7px; bottom: 7px; width: 11px; height: 11px; border-right: 2px solid var(--boe-token-text-text-secondary, #6f6f6f); border-bottom: 2px solid var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=frame]:not([aria-current=true]) [part=frame-resize] { visibility: hidden; }
  [data-shape=gateway], [data-shape=event] { width: 56px !important; height: 56px !important; min-height: 0; padding: 0; border: 0 !important; background: transparent !important; display: block; overflow: visible; }
  [data-shape=gateway]::before { content: ''; position: absolute; left: 8px; top: 8px; width: 40px; height: 40px; rotate: 45deg; border: 1.5px solid var(--boe-process-box-edge, var(--boe-control-edge, #858585)); border-radius: 8px; background: var(--boe-token-surface-surface, #fff); }
  [data-shape=event]::before { content: ''; position: absolute; left: 8px; top: 8px; width: 40px; height: 40px; border: 1.5px solid var(--boe-process-box-edge, var(--boe-control-edge, #858585)); border-radius: 50%; background: var(--boe-token-surface-surface, #fff); }
  [data-shape=event][data-kind=finish]::before { border-width: 4px; }
  [data-shape=event][data-kind=scheduled-start]::after { content: ''; position: absolute; left: 13px; top: 13px; width: 30px; height: 30px; border: 1px solid currentColor; border-radius: 50%; }
  [data-shape=gateway] > [part=icon], [data-shape=event] > [part=icon] { position: absolute; left: 18px; top: 18px; z-index: 1; }
  [data-shape=gateway] > strong, [data-shape=event] > strong { position: absolute; top: 58px; left: 50%; width: 150px; translate: -50% 0; text-align: center; font-size: 12px; }
  [data-shape=gateway] > small { display: none; }
  [part=caption] { position: absolute; left: 50%; translate: -50% 0; width: max-content; max-width: 168px; padding: 1px 4px; border-radius: 4px; text-align: center; background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 88%, transparent); }
  [part=caption][data-side=below] { top: 60px; }
  [part=caption][data-side=above] { bottom: 60px; }
  [part=caption] strong { font-size: 12.5px; font-weight: 600; line-height: 1.3; }
  [part=caption] small { display: block; font-weight: 400; }
  [part=caption] [part=technical-description] { font: 10.5px ui-monospace, 'SF Mono', Menlo, Consolas, monospace !important; white-space: nowrap; }
  [data-shape=event] > small { position: absolute; top: 75px; left: 50%; width: 172px; translate: -50% 0; text-align: center; font-size: 11px; line-height: 1.25; }
  [part=event-details] { position: absolute; top: 75px; left: 50%; width: 172px; translate: -50% 0; text-align: center; }
  [part=event-details] small { display: block; font-size: 11px; line-height: 1.25; }
  [data-shape=gateway][aria-current=true]::before, [data-shape=event][aria-current=true]::before { border-color: var(--boe-token-surface-surface-brand, #0061d5); background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 7%, var(--boe-token-surface-surface, #fff)); }
  [part=port] { position: absolute; z-index: 5; width: 24px; height: 24px; min-height: 24px; padding: 0; border: 0; border-radius: 50%; background: transparent; opacity: 0; }
  [part=port][data-side=north] { left: calc(50% - 12px); top: -12px; }
  [part=port][data-side=south] { left: calc(50% - 12px); bottom: -12px; }
  [part=port][data-side=east] { right: -12px; top: calc(50% - 12px); }
  [part=port][data-side=west] { left: -12px; top: calc(50% - 12px); }
  [part=port]::before { content: ''; display: block; width: 10px; height: 10px; margin: 7px; border: 1.5px solid var(--boe-token-surface-surface-brand, #0061d5); border-radius: 50%; background: var(--boe-token-surface-surface, #fff); }
  [part=port]:hover::before, [part=port]:focus-visible::before { width: 22px; height: 22px; margin: 1px; background: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=port]::after { position: absolute; inset: 1px; display: none; place-items: center; color: #fff; font-size: 15px; font-weight: 700; line-height: 1; }
  [part=port][data-side=north]::after { content: '↑'; }
  [part=port][data-side=east]::after { content: '→'; }
  [part=port][data-side=south]::after { content: '↓'; }
  [part=port][data-side=west]::after { content: '←'; }
  [part=port]:hover::after, [part=port]:focus-visible::after, [part=port][data-hot=true]::after { display: grid; }
  [part=port][data-hot=true] { opacity: 1; }
  [part=port][data-hot=true]::before { width: 22px; height: 22px; margin: 1px; background: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=end-grip] { position: absolute; z-index: 8; width: 24px; height: 24px; min-height: 24px; padding: 0; border: 0; border-radius: 50%; background: transparent; }
  [part=end-grip]::before { content: ''; display: block; width: 10px; height: 10px; margin: 7px; border: 1.5px solid var(--boe-token-surface-surface-brand, #0061d5); border-radius: 50%; background: var(--boe-token-surface-surface, #fff); }
  [part=box]:hover [part=port], [part=box]:focus-within [part=port], [part=box][aria-current=true] [part=port], [part=frame]:hover [part=port] { opacity: 1; }
  [part=connection] { position: absolute; z-index: 5; display: flex; align-items: center; gap: 4px; transform: translate(-50%,-50%); min-width: 0; min-height: 0; padding: 2px 6px; border-radius: 6px; background: var(--boe-token-surface-surface-secondary, #fbfbfb); font-size: 12px; font-weight: 600; white-space: nowrap; }
  /* Unlabelled lines still need a reachable midpoint for pointer insert/selection. */
  [part=connection]:has(> span:empty):not(:has(> small)) { padding: 0; background: transparent; min-width: var(--boe-process-hit-target, calc(24px * var(--boe-process-inverse-zoom, 1))); min-height: var(--boe-process-hit-target, calc(24px * var(--boe-process-inverse-zoom, 1))); }
  [part=connection] > small { margin-left: 4px; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 11px; font-weight: 400; font-variant-numeric: tabular-nums; }
  [part=connection-actions] { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; width: max-content; padding: 4px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 8px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); opacity: 0; pointer-events: none; }
  [part=connection]:hover [part=connection-actions], [part=connection]:focus-within [part=connection-actions] { opacity: 1; pointer-events: auto; }
  [part=connection-actions] button { min-width: max(24px, var(--boe-process-hit-target, calc(24px * var(--boe-process-inverse-zoom, 1)))); min-height: max(32px, var(--boe-process-hit-target, calc(24px * var(--boe-process-inverse-zoom, 1)))); padding: 4px; font-size: 12px; }
  [part=note] { width: 208px; border: 1px dashed var(--boe-process-box-edge, var(--boe-control-edge, #858585)); border-radius: 8px; }
  [part=section] { z-index: 0; border: 1px solid var(--boe-process-box-edge, var(--boe-control-edge, #858585)); border-radius: 16px; background: color-mix(in srgb, var(--boe-token-surface-surface, #fff) 45%, transparent); }
  [part=section] strong { display: block; font-size: 12.5px; font-weight: 650; line-height: 1.3; }
  [part=section] small { display: block; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 11.5px; line-height: 1.35; }
  [part=note] { pointer-events: auto !important; }
  [part=note][data-selected=true] { outline: 2px solid var(--boe-process-line-selected, var(--boe-brand-fill, #1976d2)); }
  [part=note]:focus-visible { outline: 2px solid var(--boe-focus-ring, #1976d2); outline-offset: 3px; }
  [part=note], [part=section] { position: absolute; padding: 8px; pointer-events: none; }
  [part=marquee] { position: absolute; border: 2px solid var(--boe-token-surface-surface-brand, #0061d5); background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent); pointer-events: none; }
  [part=connect-tooltip] { position: absolute; z-index: 20; max-width: 240px; padding: 5px 8px; border-radius: 7px; background: var(--boe-token-text-text, #141413); color: var(--boe-token-surface-surface, #fff); font-size: 12px; pointer-events: none; box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=connect-tooltip][data-invalid=true] { background: var(--boe-token-text-status-text-error, #b92340); color: #fff; }
  [part=ghost-box], [part=palette-ghost] { position: absolute; z-index: 5; display: flex; align-items: center; padding: 11px 12px; border: 1.5px dashed var(--boe-token-surface-surface-brand, #0061d5); border-radius: 8px; background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #fff)); font-size: 13px; font-weight: 650; pointer-events: none; }
  [part=palette-ghost][data-pointer] { position: fixed; z-index: 100; padding: 8px 12px; border: 1px solid var(--boe-token-surface-surface-brand, #0061d5); border-radius: 10px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-token-elevation-overlay, 0 8px 24px #0002); font-size: 13px; font-weight: 600; line-height: 1.45; gap: 8px; translate: -50% -50%; }
  [part=palette-ghost][data-pointer] svg { width: 20px; height: 20px; }
  [part=guide] { position: absolute; background: var(--boe-token-surface-surface-brand, #0061d5); pointer-events: none; }
  [part=measure] { position: absolute; padding: 4px; background: var(--boe-token-surface-surface, #fff); font-size: 12px; pointer-events: none; }
  [part=insert-chooser] { max-width: calc(100vw - 32px); max-height: 65vh; overflow: auto; padding: 12px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface, #fff); }
  [part=keyboard-chooser] { position: fixed; inset: auto; width: min(320px, calc(100vw - 24px)); max-height: min(420px, calc(100dvh - 24px)); margin: 0; overflow: auto; padding: 12px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface, #fff); color: var(--boe-token-text-text, #141413); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=chooser-title] { margin: 0 0 10px; font-size: 12px; font-weight: 650; line-height: 1.4; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=controls] { position: absolute; left: 16px; bottom: 16px; z-index: 10; display: flex; align-items: center; gap: 2px; padding: 4px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=controls] button:not([data-command=reset]) { width: 32px; padding: 0; }
  [part=controls-divider] { width: 1px; height: 20px; margin: 0 4px; background: var(--boe-token-stroke-stroke, #e8e8e8); }
  [part=controls] [data-command=reset] { min-width: 56px; padding: 0 6px; font-variant-numeric: tabular-nums; }
  [part=minimap] { position: absolute; right: 16px; bottom: 16px; width: 208px; height: 136px; touch-action: none; background: var(--boe-token-surface-surface, #fff); border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=minimap] rect:not([data-viewport]) { fill: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 35%, transparent); }
  [part=minimap] rect[data-selected=true] { fill: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=minimap] rect[data-section] { fill: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 8%, transparent); }
  [part=minimap] [data-viewport] { fill: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, transparent); stroke: var(--boe-token-surface-surface-brand, #0061d5); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
  [part=selection-toolbar] { position: absolute; bottom: auto; z-index: 11; display: flex; flex-wrap: nowrap; gap: 2px; padding: 4px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); white-space: nowrap; }
  [part=selection-toolbar] button { display: inline-flex; align-items: center; gap: 4px; }
  [part=selection-plus] { font-size: 18px; line-height: 12px; font-weight: 500; }
  [part=checks] { display: grid; gap: 6px; margin: 0; padding: 0; }
  [part=checks] button { width: 100%; display: grid; grid-template-columns: 16px 1fr; align-items: start; gap: 8px; padding: 8px 10px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 10px; text-align: start; background: var(--boe-token-surface-surface, #fff); color: var(--boe-token-text-text, #222); line-height: 1.45; }
  [part=check-icon] { flex: 0 0 16px; width: 16px; height: 16px; margin-top: 1px; color: var(--boe-token-text-status-text-error, #b92340); }
  [part=checks] strong { display: block; font-size: 13px; font-weight: 600; line-height: 1.45; }
  [part=checks] small { color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12.5px; }
  [part=check-icon][data-tone=success] { color: var(--boe-token-text-status-text-success, #138a58); }
  [part=problem] { display: flex; align-items: center; gap: 4px; }
  [part=problem] [part=check-icon] { flex-basis: 12px; width: 12px; height: 12px; margin: 0; }
  [part=checks-ready] { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--boe-token-text-text, #222); font-size: 13px; line-height: 1.45; }
  [part=process-heading] { display: grid; gap: 2px; padding: 0 16px 12px; }
  [part=process-title] { font-size: 15px; line-height: 1.4; }
  [part=process-summary] { color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12.5px; }
  [part=pane-tabs] { display: flex; flex-wrap: nowrap; gap: 4px; margin: 0; padding: 0 16px; border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); overflow-x: auto; }
  [part=pane-tabs] button { flex: none; min-height: 40px; border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: transparent; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 13px; font-weight: 600; }
  [part=pane-tabs] button[aria-selected=true] { color: var(--boe-token-text-text, #141413); border-bottom-color: currentColor; }
  [part=editor], [part=pane-content] { padding: 8px 16px; }
  [part=editor] { display: grid; align-content: start; gap: 12px; }
  [part=inspector-kind] { display: none; }
  [part=inspector-purpose] { margin: 0; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12.5px; }
  [part=field] { display: grid; gap: 4px; }
  [part=field] label { display: grid; gap: 5px; font-size: 12.5px; font-weight: 650; }
  [part=field] :is(input:not([type=checkbox]),textarea,select) { width: 100%; min-height: 36px; padding: 7px 10px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 8px; background: var(--boe-token-surface-surface, #fff); color: var(--boe-token-text-text, #141413); font-family: inherit; font-size: 13px; line-height: 1.4; }
  [part=field] textarea { min-height: 76px; resize: vertical; }
  [part=field]:has([part=action-options]) { position: relative; }
  [part=field]:has([part=action-options]) input { padding-right: 34px; }
  [part=action-caret] { position: absolute; z-index: 1; top: 25px; right: 2px; width: 32px; min-height: 32px; padding: 0; border: 0; background: transparent; font-size: 18px; }
  [part=action-options] { position: absolute; z-index: 30; top: calc(100% - 1px); left: 0; right: 0; max-height: 280px; overflow: auto; padding: 6px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 10px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=action-options][hidden] { display: none; }
  [part=action-options] button { display: block; width: 100%; min-height: 36px; padding: 7px 9px; border: 0; border-radius: 7px; text-align: start; background: transparent; font-size: 12.5px; }
  [part=action-options] button:hover, [part=action-options] [aria-selected=true] { background: var(--boe-token-surface-surface-hover, #f4f4f4); }
  [part=action-options] button strong { display: block; font-size: 13px; font-weight: 650; }
  [part=action-options] button small { display: block; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=action-options] [part=action-back] { color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=field] input[type=checkbox] { justify-self: start; width: 18px; height: 18px; accent-color: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=field] small { color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12px; line-height: 1.4; }
  [part=field] [part=field-problem] { color: var(--boe-token-text-status-text-error, #b92340); }
  [part=editor], [part=pane-content], [part=editor] > *, [part=pane-content] > * { min-width: 0; }
  [part=process-title], [part=process-summary] { min-width: 0; overflow-wrap: anywhere; }
  :is([part=local-variable-summary],[part=saved-result-summary]) :is(ul,li) { min-width: 0; max-width: 100%; }
  [part=pane-content][data-pane=Variables] { display: grid; align-content: start; gap: 14px; }
  [part=variables-intro], [part=variable-list] > p { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--boe-token-text-text-secondary,#6f6f6f); }
  [part=variable-scopes] { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; margin: 0; font-size: 12.5px; line-height: 1.45; }
  [part=variable-scopes] dt { font-weight: 650; }
  [part=variable-scopes] dd { margin: 0; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  :is([part=local-variable-summary],[part=saved-result-summary],[part=local-variables]) { font-size: 12.5px; line-height: 1.45; }
  :is([part=local-variable-summary],[part=saved-result-summary],[part=local-variables]) h3 { margin: 0 0 6px; font-size: 12.5px; line-height: 1.45; font-weight: 650; }
  :is([part=local-variable-summary],[part=saved-result-summary],[part=local-variables]) p { margin: 0; line-height: 1.5; color: var(--boe-token-text-text-secondary,#6f6f6f); }
  :is([part=local-variable-summary],[part=saved-result-summary]) ul { list-style: none; display: grid; gap: 4px; margin: 0; padding: 0; }
  :is([part=local-variable-summary],[part=saved-result-summary]) li { display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 10px; border: 1px solid var(--boe-token-stroke-stroke,#e8e8e8); border-radius: 10px; background: var(--boe-token-surface-surface-secondary,#fbfbfb); font-size: 13px; line-height: 1.45; }
  :is([part=local-variable-summary],[part=saved-result-summary]) li > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  :is([part=local-variable-summary],[part=saved-result-summary]) code { font-family: monospace; font-size: 13px; }
  :is([part=local-variable-summary],[part=saved-result-summary]) em { font-style: normal; color: var(--boe-token-text-text-secondary,#6f6f6f); }
  [part=local-variable-list], [part=variable-list] { display: grid; gap: 10px; }
  [part=local-variable-row] { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr) 32px; gap: 6px; align-items: center; }
  [part=local-variable-row] [part=field-problem] { grid-column: 1 / -1; color: var(--boe-token-text-status-text-error, #b92340); font-size: 12px; }
  [part=local-variables] label { display: block; min-width: 0; }
  [part=local-variables] input { width: 100%; min-width: 0; min-height: 32px; padding: 5px 10px; border: 1px solid var(--boe-token-surface-surface-quaternary,#d3d3d3); border-radius: 10px; background: var(--boe-token-surface-surface,#fff); color: var(--boe-token-text-text,#141413); font: 12.5px/1.45 var(--boe-token-font-family-base,Inter,sans-serif); }
  [part=local-variables] input:focus-visible { outline-offset: 1px; }
  [part=local-variable-actions], [part=variable-actions] { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 4px; }
  [part=variable-icon] { flex: 0 0 16px; width: 16px; height: 16px; color: var(--boe-token-text-text-secondary,#6f6f6f); }
  [part=variable-chips] { display: flex; flex-wrap: wrap; gap: 4px; }
  [part=variable-chips] button { min-height: 24px; padding: 2px 8px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface-secondary, #fbfbfb); font-size: 11.5px; }
  [part=leads-to] { display: grid; gap: 6px; padding-top: 10px; border-top: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); }
  [part=leads-to] h3 { margin: 0; font-size: 12.5px; }
  [part=lead-row] { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12.5px; }
  [part=lead-row] button, [part=leads-to] > button, [part=inspector-actions] button { min-height: 28px; padding: 4px 8px; font-size: 12px; }
  [part=inspector-metrics] { margin: 0; font-size: 12.5px; line-height: 1.5; font-variant-numeric: tabular-nums; }
  [part=inspector-metrics] h3 { margin: 0 0 6px; font-size: 12.5px; }
  [part=inspector-metrics] p { margin: 0; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=inspector-metrics] table { width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.45; }
  [part=inspector-metrics] :is(th,td) { padding: 5px 0; border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); font-weight: 400; }
  [part=inspector-metrics] th { text-align: start; font-variant-numeric: normal; }
  [part=inspector-metrics] td { text-align: right; font-variant-numeric: tabular-nums; }
  [part=inspector-actions] { display: flex; gap: 8px; padding-top: 10px; border-top: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); }
  [part=arrange-actions] { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 6px; }
  [part=arrange-actions] button { min-height: 32px; padding: 5px 7px; font-size: 12px; text-align: start; }
  [part=outline-intro] { margin: 4px 0 14px; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12.5px; line-height: 1.5; }
  [part=copy-outline] { justify-self: start; min-height: 32px; margin-top: 4px; padding: 0 14px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: .01em; }
  [part=outline-list] { margin: 0; padding-left: 22px; font-size: 13.5px; line-height: 1.5; }
  [part=outline-list] [part=outline-list] { margin-top: 2px; }
  [part=outline-list] li { margin: 3px 0; padding-left: 2px; }
  [part=outline-list] li::marker { color: var(--boe-token-text-text-secondary, #6f6f6f); font-variant-numeric: tabular-nums; font-size: 12.5px; }
  [part=outline-list] button, [part=outline-list] strong { border: 0; border-radius: 4px; background: transparent; padding: 0; min-height: 24px; display: inline-block; font-size: 13.5px; font-weight: 600; line-height: 24px; text-align: start; }
  [part=outline-list] button:hover { color: var(--boe-token-surface-surface-brand, #0061d5); text-decoration: underline; text-underline-offset: 2px; }
  [part=outline-list] button[aria-current=true] { color: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=outline-list] p { margin: 0; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12.5px; line-height: 1.5; }
  [part=inspector-heading] { margin: 0 0 2px; font-size: 15px; font-weight: 650; }
  [part=inspector-heading][data-single=true]:not(:focus-visible) { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  [part=variable-row], [part=connection-row] { display: grid; gap: 4px; padding: 10px 0; border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); font-size: 12.5px; }
  :host([data-variables-editable]) [part=variable-row] { grid-template-columns: minmax(0,1fr) minmax(0,1fr) 32px; gap: 6px; align-items: center; }
  :host([data-variables-editable]) [part=variable-row] label:has([data-variable-key=name]) { grid-column: 1; grid-row: 1; }
  :host([data-variables-editable]) [part=variable-row] label:has([data-variable-key=value]) { grid-column: 2; grid-row: 1; }
  :host([data-variables-editable]) [part=variable-row] label:has([data-variable-key=scope]) { grid-column: 2; grid-row: 2; }
  :host([data-variables-editable]) [part=variable-remove] { grid-column: 3; grid-row: 1; }
  :host([data-variables-editable]) [part=variable-row] :is(input,select) { width: 100%; min-width: 0; min-height: 32px; border-radius: 10px; font-size: 12.5px; }
  :host([data-variables-editable]) [part=variable-row] p { grid-column: 1 / -1; }
  :host([data-variables-editable]) [part=variable-row] [part=field-problem] { color: var(--boe-token-text-status-text-error, #b92340); }
  [part=variable-remove], [part=variable-add] { min-height: 32px; align-self: end; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 8px; background: var(--boe-token-surface-surface, #fff); color: inherit; cursor: pointer; }
  [part=variable-row] p { margin: 0; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=variable-scope] { color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 11.5px; }
  [part=variable-row] label { display: grid; gap: 4px; font-weight: 650; }
  [part=variable-row] :is(input,select) { min-height: 36px; padding: 7px 10px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 8px; background: var(--boe-token-surface-surface, #fff); }
  :host([data-variables-editable]) [part=variable-row] { padding: 0; border: 0; }
  :host([data-variables-editable]) [part=variable-row] label { display: block; min-width: 0; }
  :host([data-variables-editable]) [part=variable-row] label:has([data-variable-key=description]) { grid-column: 1; grid-row: 2; }
  :host([data-variables-editable]) [part=variable-row] :is(input,select) { min-height: 32px; padding: 5px 10px; border: 1px solid var(--boe-token-surface-surface-quaternary,#d3d3d3); font: 12.5px/1.45 var(--boe-token-font-family-base,Inter,sans-serif); }
  :host([data-variables-editable]) [part=variable-row] select { padding: 4px 8px; }
  :host([data-variables-editable]) [part=variable-row] input:focus-visible { outline-offset: 1px; }
  [part=local-variables] button, [part=variable-add], [part=variable-remove] { display: inline-flex; align-items: center; gap: 6px; height: 32px; min-height: 32px; padding: 0 14px; border: 1px solid var(--boe-token-stroke-stroke,#e8e8e8); border-radius: 20px; background: var(--boe-token-surface-surface,#fff); font: 600 13px/1.45 var(--boe-token-font-family-base,Inter,sans-serif); letter-spacing: .01em; white-space: nowrap; }
  [part=local-variables] [data-local-key=remove], [part=variable-remove] { width: 32px; padding: 0; justify-content: center; border-color: transparent; background: transparent; align-self: center; }
  [part=local-variables] button:hover, [part=variable-add]:hover, [part=variable-remove]:hover { background: var(--boe-token-surface-surface-hover,#f4f4f4); }
  [part=local-variables] button:disabled, [part=variable-add]:disabled, [part=variable-remove]:disabled { opacity: .45; }
  [part=help] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  :host([data-narrow]) [part=layout] { grid-template-columns: minmax(0,1fr); }
  :host([data-narrow]) [part=layout] { overflow: visible; }
  :host([data-narrow]) [part=pane-drawer] { display: none; position: absolute; z-index: 40; margin: 0; max-width: none; max-height: none; padding: 0; overflow: auto; border: 0; border-radius: 0; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .24)); }
  :host([data-narrow]) [part=pane-drawer][open] { display: block; }
  :host([data-narrow]) [part=pane-title] { display: block; position: absolute; top: 18px; left: 16px; margin: 0; font-size: 14px; font-weight: 650; line-height: 20px; }
  :host([data-narrow]) [part=pane-close], :host([data-narrow]) [data-command=palette], :host([data-narrow]) [data-command=details] { display: inline-block; }
  :host([data-narrow]) [part=pane-close] { position: absolute; top: 12px; right: 12px; z-index: 1; width: 28px; height: 28px; padding: 0; border-radius: 50%; font-size: 16px; font-weight: 600; line-height: 1; }
  :host([data-narrow]) [part=pane-drawer][data-pane=palette] { left: 0; top: 0; bottom: auto; width: min(320px, 86%); height: 100%; max-height: 100%; }
  :host([data-narrow]) [part=pane-drawer][data-pane=inspector] { left: 0; right: 0; top: auto; bottom: 0; width: 100%; height: min(62%, 560px); border-radius: 24px 24px 0 0; }
  :host([data-narrow]) [part=pane-drawer][data-pane=inspector]::before { content: ''; display: block; width: 36px; height: 4px; margin: 6px auto; border-radius: 2px; background: var(--boe-token-text-text-secondary, #767676); opacity: .55; }
  :host([data-narrow]) [part=palette], :host([data-narrow]) [part=inspector] { height: 100%; }
  :host([data-narrow]) [part=inspector] { border-left: 0; }
  :host([data-narrow]) [part=palette] { padding-top: 54px; }
  :host([data-narrow]) [part=palette-heading] { display: none; }
  :host([data-narrow]) [part=minimap] { display: none; }
  :host([data-narrow]) [part=toolbar] { justify-content: flex-start; gap: 8px; padding: 8px 12px; flex-wrap: wrap; }
  :host([data-narrow]) [part=view-switch], :host([data-narrow]) [part=run-toggle] { display: none; }
  :host([data-narrow]) [data-command=checks-status] { display: none; }
  :host([data-narrow]) [part=view-menu] { display: block; }
  :host([data-hide-tidy]) [part=toolbar-title] { font-size: 14px; }
  :host([data-hide-tidy]) [part=toolbar-document] span { display: none; }
  :host([data-hide-tidy]) [part=controls] { left: 12px; bottom: 12px; }
  :host([data-narrow]) [part=selection-toolbar] [part=selection-plus] + span { display: none; }
  :host([data-hide-tidy]) [part=toolbar-actions] [data-command=tidy] { display: none; }
  :host([data-narrow]) [part=toolbar-actions] [data-command=undo], :host([data-narrow]) [part=toolbar-actions] [data-command=redo] { display: none; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; scroll-behavior: auto !important; } }
`;
