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
    min-width: 0;
    --boe-process-box-edge: color-mix(in srgb, var(--boe-token-text-text, #141413) 55%, var(--boe-token-surface-surface, #fff));
    color: var(--boe-token-text-text, #141413);
    background: var(--boe-token-surface-surface, #fff);
    font: 14px/1.5 var(--boe-token-font-family-base, Inter, sans-serif);
  }
  [part=sr-only], [part=status] { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  [part=toolbar] {
    min-height: 56px;
    margin: 0;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
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
  [part=run-toggle] { display: flex; align-items: center; gap: 6px; white-space: nowrap; font-size: 13px; font-weight: 600; }
  [part=run-toggle] input { accent-color: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=view-menu] { display: none; position: relative; }
  [part=view-menu] summary { list-style: none; padding: 4px 14px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
  [part=view-menu][open] { z-index: 20; }
  [part=view-menu-options] { position: absolute; z-index: 20; top: calc(100% + 4px); left: 0; width: 192px; padding: 6px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 10px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=view-menu] button { display: block; width: 100%; text-align: start; background: transparent; }
  [part=layout] {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr) 320px;
    gap: 0;
    min-height: 0;
    height: var(--boe-process-height, 660px);
    overflow: hidden;
  }
  [part=pane-drawer] { display: contents; color: inherit; }
  [part=pane-drawer]::backdrop, [part=insert-chooser]::backdrop { background: rgb(0 0 0 / .45); }
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
  [part=group] { margin: 4px 4px 6px; font-size: 12px; font-weight: 650; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=choice] {
    display: grid; grid-template-columns: 20px minmax(0,1fr); gap: 0 10px;
    min-height: 44px; padding: 8px 10px; border: 1px solid transparent; border-radius: 10px;
    text-align: start; background: transparent; cursor: grab;
  }
  [part=choice]:hover { border-color: var(--boe-token-stroke-stroke, #e8e8e8); background: var(--boe-token-surface-surface-hover, #f4f4f4); }
  [part=choice-icon] { grid-row: span 2; width: 20px; height: 20px; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=choice][data-tone=accent] [part=choice-icon] { color: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=choice-icon] svg { width: 20px; height: 20px; }
  [part=choice-name] { font-size: 13px; font-weight: 600; line-height: 1.3; }
  [part=choice-description] { grid-column: 2; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12px; line-height: 1.35; }
  [part=palette-hint] { margin: 4px; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12px; line-height: 1.45; }
  [part=canvas] {
    position: relative; min-width: 0; height: 100%; overflow: hidden;
    border: 0; border-radius: 0;
    background-color: var(--boe-token-surface-surface-secondary, #fbfbfb);
    background-image: radial-gradient(circle, var(--boe-token-stroke-stroke-hover, #d3d3d3) 1px, transparent 1.2px);
    background-size: 12px 12px;
    touch-action: none; user-select: none; cursor: grab;
  }
  [part=canvas][data-panning] { cursor: grabbing; }
  [part=hold] { position: absolute; z-index: 12; top: 12px; left: 50%; translate: -50% 0; display: flex; align-items: center; gap: 12px; max-width: calc(100% - 24px); padding: 8px 12px; border: 1px solid var(--boe-token-stroke-status-stroke-warning, #9a6b00); border-radius: 8px; background: var(--boe-token-surface-status-surface-warning, #fff7df); color: var(--boe-token-text-status-text-warning, #6b4a00); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); font-size: 12.5px; cursor: default; }
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
  [part=box]:hover, [part=frame]:hover { border-color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [data-connect-target=true] { border-color: var(--boe-token-surface-surface-brand, #0061d5) !important; }
  [part=box] strong, [part=frame] strong { overflow-wrap: anywhere; }
  [part=box] strong, [part=frame] strong { font-size: 13.5px; font-weight: 650; line-height: 1.3; }
  [part=box] small, [part=frame] small { grid-column: 2; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12.5px; line-height: 1.35; }
  [part=technical-description] { font: 12px/1.4 ui-monospace, 'SF Mono', Menlo, Consolas, monospace !important; overflow-wrap: anywhere; }
  [part=metrics] { grid-column: 2; font-size: 12px; font-variant-numeric: tabular-nums; }
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
  [data-shape=event] > small { position: absolute; top: 75px; left: 50%; width: 172px; translate: -50% 0; text-align: center; font-size: 11px; line-height: 1.25; }
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
  [part=connection]:has(> span:empty) { padding: 0; background: transparent; min-width: 0; min-height: 0; }
  [part=connection-actions] { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; width: max-content; padding: 4px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 8px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); opacity: 0; pointer-events: none; }
  [part=connection]:hover [part=connection-actions], [part=connection]:focus-within [part=connection-actions] { opacity: 1; pointer-events: auto; }
  [part=connection-actions] button { min-height: 32px; padding: 4px; font-size: 12px; }
  [part=note] { width: 208px; border: 1px dashed var(--boe-process-box-edge, var(--boe-control-edge, #858585)); border-radius: 8px; }
  [part=section] { z-index: 0; border: 1px solid var(--boe-process-box-edge, var(--boe-control-edge, #858585)); border-radius: 16px; background: color-mix(in srgb, var(--boe-token-surface-surface, #fff) 45%, transparent); }
  [part=section] strong { display: block; font-size: 12.5px; font-weight: 650; line-height: 1.3; }
  [part=section] small { display: block; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 11.5px; line-height: 1.35; }
  [part=note], [part=section] { position: absolute; padding: 8px; pointer-events: none; }
  [part=marquee] { position: absolute; border: 2px solid var(--boe-token-surface-surface-brand, #0061d5); background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent); pointer-events: none; }
  [part=connect-tooltip] { position: absolute; z-index: 20; max-width: 240px; padding: 5px 8px; border-radius: 7px; background: var(--boe-token-text-text, #141413); color: var(--boe-token-surface-surface, #fff); font-size: 12px; pointer-events: none; box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=connect-tooltip][data-invalid=true] { background: var(--boe-token-text-status-text-error, #b92340); color: #fff; }
  [part=ghost-box], [part=palette-ghost] { position: absolute; z-index: 5; display: flex; align-items: center; padding: 11px 12px; border: 1.5px dashed var(--boe-token-surface-surface-brand, #0061d5); border-radius: 8px; background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #fff)); font-size: 13px; font-weight: 650; pointer-events: none; }
  [part=guide] { position: absolute; background: var(--boe-token-surface-surface-brand, #0061d5); pointer-events: none; }
  [part=measure] { position: absolute; padding: 4px; background: var(--boe-token-surface-surface, #fff); font-size: 12px; pointer-events: none; }
  [part=insert-chooser] { max-width: calc(100vw - 32px); max-height: 65vh; overflow: auto; padding: 12px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface, #fff); }
  [part=controls] { position: absolute; left: 16px; bottom: 16px; z-index: 10; display: flex; align-items: center; gap: 2px; padding: 4px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=controls] [data-command=reset] { min-width: 56px; font-variant-numeric: tabular-nums; }
  [part=minimap] { position: absolute; right: 16px; bottom: 16px; width: 208px; height: 136px; touch-action: none; background: var(--boe-token-surface-surface, #fff); border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); }
  [part=minimap] rect:not([data-viewport]) { fill: var(--boe-token-stroke-stroke-hover, #d3d3d3); }
  [part=minimap] [data-viewport] { fill: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 9%, transparent); stroke: var(--boe-token-surface-surface-brand, #0061d5); stroke-width: 1; }
  [part=selection-toolbar] { position: absolute; bottom: auto; z-index: 11; display: flex; flex-wrap: nowrap; gap: 2px; padding: 4px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .16)); white-space: nowrap; }
  [part=checks] { display: grid; gap: 6px; margin-top: 12px; }
  [part=checks] button { color: var(--boe-token-text-status-text-error, #b92340); }
  [part=process-heading] { display: grid; gap: 2px; padding: 0 16px 12px; }
  :host([embed-mode]) [part=process-heading], :host([embed-mode]) [part=view-switch], :host([embed-mode]) [part=run-toggle], :host([embed-mode]) [part=view-menu] { display: none; }
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
  [part=variable-chips] { display: flex; flex-wrap: wrap; gap: 4px; }
  [part=variable-chips] button { min-height: 24px; padding: 2px 8px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 12px; background: var(--boe-token-surface-surface-secondary, #fbfbfb); font-size: 11.5px; }
  [part=leads-to] { display: grid; gap: 6px; padding-top: 10px; border-top: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); }
  [part=leads-to] h3 { margin: 0; font-size: 12.5px; }
  [part=lead-row] { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12.5px; }
  [part=lead-row] button, [part=leads-to] > button, [part=inspector-actions] button { min-height: 28px; padding: 4px 8px; font-size: 12px; }
  [part=inspector-metrics] { margin: 0; padding-top: 10px; border-top: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); font-size: 12px; font-variant-numeric: tabular-nums; }
  [part=inspector-metrics] h3 { margin: 0 0 6px; font-size: 12.5px; }
  [part=inspector-metrics] dl { display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; margin: 0; }
  [part=inspector-metrics] dt { color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=inspector-metrics] dd { margin: 0; font-weight: 650; }
  [part=inspector-actions] { display: flex; gap: 8px; padding-top: 10px; border-top: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); }
  [part=arrange-actions] { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 6px; }
  [part=arrange-actions] button { min-height: 32px; padding: 5px 7px; font-size: 12px; text-align: start; }
  [part=outline-intro] { margin: 4px 0 14px; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12.5px; line-height: 1.5; }
  [part=copy-outline] { justify-self: start; min-height: 28px; margin-bottom: 8px; padding: 4px 10px; border-radius: 16px; font-size: 12px; font-weight: 650; }
  [part=outline-list] { margin: 0; padding-left: 18px; display: grid; gap: 8px; }
  [part=outline-list] [part=outline-list] { margin: 6px 0 0; gap: 6px; }
  [part=outline-list] li { padding-left: 0; font-size: 12.5px; }
  [part=outline-list] li::marker { color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=outline-list] button, [part=outline-list] strong { border: 0; border-radius: 4px; background: transparent; padding: 0; min-height: 0; font-size: 12.5px; font-weight: 650; line-height: 1.45; text-align: start; }
  [part=outline-list] button:hover { color: var(--boe-token-surface-surface-brand, #0061d5); text-decoration: underline; }
  [part=outline-list] button[aria-current=true] { color: var(--boe-token-surface-surface-brand, #0061d5); }
  [part=outline-list] p { margin: 2px 0 0; color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 12px; line-height: 1.45; }
  [part=inspector-heading] { margin: 0 0 2px; font-size: 15px; font-weight: 650; }
  [part=inspector-heading][data-single=true]:not(:focus-visible) { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  [part=checks] { margin: 0; padding: 0; }
  [part=checks] button { width: 100%; border: 0; border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 0; text-align: start; background: transparent; }
  [part=variable-row], [part=connection-row] { display: grid; gap: 4px; padding: 10px 0; border-bottom: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); font-size: 12.5px; }
  [part=variable-row] p { margin: 0; color: var(--boe-token-text-text-secondary, #6f6f6f); }
  [part=variable-scope] { color: var(--boe-token-text-text-secondary, #6f6f6f); font-size: 11.5px; }
  [part=variable-row] label { display: grid; gap: 4px; font-weight: 650; }
  [part=variable-row] input { min-height: 36px; padding: 7px 10px; border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8); border-radius: 8px; background: var(--boe-token-surface-surface, #fff); }
  [part=help] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  :host([data-narrow]) [part=layout] { grid-template-columns: minmax(0,1fr); }
  :host([data-narrow]) [part=pane-drawer] { display: none; position: fixed; z-index: 40; margin: 0; max-width: none; max-height: none; padding: 0; overflow: auto; border: 0; border-radius: 0; background: var(--boe-token-surface-surface, #fff); box-shadow: var(--boe-shadow-overlay, 0 4px 12px rgb(0 0 0 / .24)); }
  :host([data-narrow]) [part=pane-drawer][open] { display: block; }
  :host([data-narrow]) [part=pane-title] { display: block; position: absolute; top: 18px; left: 16px; margin: 0; font-size: 14px; font-weight: 650; line-height: 20px; }
  :host([data-narrow]) [part=pane-close], :host([data-narrow]) [data-command=palette], :host([data-narrow]) [data-command=details] { display: inline-block; }
  :host([data-narrow]) [part=pane-close] { position: absolute; top: 12px; right: 12px; z-index: 1; width: 28px; height: 28px; padding: 0; border-radius: 50%; font-size: 16px; font-weight: 600; line-height: 1; }
  :host([data-narrow]) [part=pane-drawer][data-pane=palette] { left: 0; top: 0; bottom: 0; width: min(320px, 86vw); }
  :host([data-narrow]) [part=pane-drawer][data-pane=inspector] { left: 0; right: 0; top: auto; bottom: 0; width: 100%; height: min(62vh, 560px); border-radius: 24px 24px 0 0; }
  :host([data-narrow]) [part=pane-drawer][data-pane=inspector]::before { content: ''; display: block; width: 36px; height: 4px; margin: 6px auto; border-radius: 2px; background: var(--boe-token-text-text-secondary, #767676); opacity: .55; }
  :host([data-narrow]) [part=palette], :host([data-narrow]) [part=inspector] { height: 100%; }
  :host([data-narrow]) [part=palette] { padding-top: 54px; }
  :host([data-narrow]) [part=minimap] { display: none; }
  :host([data-narrow]) [part=toolbar] { justify-content: flex-start; }
  :host([data-narrow]) [part=view-switch], :host([data-narrow]) [part=run-toggle] { display: none; }
  :host([data-narrow]) [part=view-menu] { display: block; }
  :host([data-narrow]) [part=controls] { left: 12px; bottom: 12px; }
  :host([data-phone]) [data-command=tidy] { display: none; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; scroll-behavior: auto !important; } }
`;
