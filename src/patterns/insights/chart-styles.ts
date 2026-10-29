/** Shared typography and surfaces keep the insight family visually consistent. */
export const chartStyles = `
  :host { display:block; contain-intrinsic-inline-size:36rem; min-inline-size:0; color:var(--boe-chart-ink,color-mix(in srgb,var(--boe-token-text-text,#102347) 88%,var(--boe-token-surface-surface-brand,#0061d5))); font:inherit; }
  :host([hidden]), [hidden] { display:none!important; }
  *, *::before, *::after { box-sizing:border-box; }
  [part="panel"] { display:grid; gap:1rem; padding:1.5rem; border:1px solid var(--boe-token-stroke-stroke,#e8e8e8); border-radius:.375rem; background:var(--boe-token-surface-surface,#fff); min-inline-size:0; }
  [part="header"] { display:flex; flex-wrap:wrap; align-items:start; justify-content:space-between; gap:1rem; }
  [part="meta"] { display:grid; gap:.4rem; min-inline-size:0; }
  [part="title"] { margin:0; font:inherit; font-size:1.125rem; font-weight:650; line-height:1.4; overflow-wrap:anywhere; }
  [part="summary"] { font-size:1.125rem; font-weight:600; letter-spacing:-.015em; line-height:1.2; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
  [part="message"], [part="timeframe"] { font-size:.8125rem; line-height:1.5; color:var(--boe-chart-muted,color-mix(in srgb,var(--boe-token-text-text-secondary,#566781) 92%,var(--boe-token-surface-surface-brand,#0061d5))); overflow-wrap:anywhere; }
  [part="header-side"] { display:grid; justify-items:end; gap:.6rem; }
  [part="actions"] { display:flex; flex-wrap:wrap; gap:.5rem; }
  [part="action"] { appearance:none; font:inherit; font-size:.8125rem; padding:.45rem .7rem; color:inherit; background:var(--boe-token-surface-surface,#fff); border:1px solid var(--boe-token-stroke-stroke,#e8e8e8); border-radius:.375rem; cursor:pointer; }
  [part="action"][data-tone="primary"] { background:var(--boe-token-surface-surface-brand,#0061d5); color:var(--boe-token-text-text-on-brand,#fff); border-color:transparent; }
  button:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand,#0061d5); outline-offset:3px; }
  [part="legend"] { display:flex; flex-wrap:wrap; gap:.5rem 1.25rem; font-size:.8125rem; }
  [part="legend-item"] { display:inline-flex; align-items:center; gap:.5rem; }
  [part="legend-swatch"] { display:inline-block; inline-size:.625rem; block-size:.625rem; border-radius:2px; background:var(--boe-token-surface-surface-brand,#0061d5); flex:none; }
  [data-tone="accent"] [part="legend-swatch"] { background:#7c5cce; }
  [data-tone="success"] [part="legend-swatch"] { background:#21856d; }
  [part="legend-value"] { color:var(--boe-chart-muted,color-mix(in srgb,var(--boe-token-text-text-secondary,#566781) 92%,var(--boe-token-surface-surface-brand,#0061d5))); font-variant-numeric:tabular-nums; }
  [part="empty"] { padding:2rem 1rem; text-align:center; font-size:.875rem; color:var(--boe-chart-muted,color-mix(in srgb,var(--boe-token-text-text-secondary,#566781) 92%,var(--boe-token-surface-surface-brand,#0061d5))); }
  [part="inspection"] { display:grid; gap:.25rem; align-content:start; min-block-size:5.2rem; }
  [part="inspection-label"] { font-size:.8125rem; font-weight:600; }
  [part="inspection-value"] { font-size:1.75rem; font-weight:650; line-height:1.2; letter-spacing:-.025em; font-variant-numeric:tabular-nums; }
  [part="comparison"], [part="unit"], [part="axis-title"], [part="note"], [part="status"] { font-size:.8125rem; line-height:1.5; color:var(--boe-chart-muted,color-mix(in srgb,var(--boe-token-text-text-secondary,#566781) 92%,var(--boe-token-surface-surface-brand,#0061d5))); overflow-wrap:anywhere; }
  [part="axis-title"] { text-align:center; margin-top:-.5rem; }
  [part="footer"] { display:grid; gap:.75rem; border-top:1px solid var(--boe-token-stroke-stroke,#dce3ed); padding-top:1rem; }
  [part="footer-controls"] { display:flex; gap:.75rem; flex-wrap:wrap; align-items:center; }
  [part="clear-selection"], [part="table-toggle"] { appearance:none; border:0; padding:.5rem 0; font:inherit; font-size:.8125rem; background:none; color:var(--boe-token-surface-surface-brand,#0061d5); cursor:pointer; text-decoration:underline; text-underline-offset:.2em; }
  [part="selection-label"] { position:absolute; bottom:-1.2rem; font-size:.6875rem; font-weight:600; color:inherit; }
  [data-selected="true"] [part="selection-label"]::before { content:"● "; }
  [part="data-table"] { overflow:auto; }
  table { border-collapse:collapse; width:100%; font-size:.8125rem; } caption { text-align:start; font-weight:600; padding-bottom:.75rem; } th, td { text-align:start; padding:.6rem .4rem; border-bottom:1px solid var(--boe-token-stroke-stroke,#dce3ed); overflow-wrap:anywhere; } td { font-variant-numeric:tabular-nums; }
  [part="empty"][data-loading="true"] { min-block-size:14rem; border-radius:.25rem; background:var(--boe-token-surface-surface-secondary,#f4f6f8); }
  @media print { [part="footer-controls"] { display:none; } }
  @container (max-width:400px) { [part="panel"] { padding:1rem; gap:1.25rem; } }
`;

export const barStyles = `
  :host { container-type:inline-size; }
  [part="visual"] { position:relative; overflow-x:auto; padding-block:1.5rem 1.5rem; }
  [part="chart"] { position:relative; display:grid; grid-auto-flow:column; grid-auto-columns:minmax(2.25rem,1fr); padding-inline-start:3rem; gap:.25rem; }
  [part="grid"] { position:absolute; inset:0 0 var(--label-lane,2rem) 3rem; pointer-events:none; }
  [part="grid-line"] { position:absolute; inset-inline:0; border-top:1px solid color-mix(in srgb,var(--boe-token-stroke-stroke,#e8e8e8) 70%,transparent); }
  [part="axis-label"] { position:absolute; inset-inline-end:calc(100% + .6rem); transform:translateY(-50%); font-size:.6875rem; line-height:1; color:var(--boe-chart-muted,color-mix(in srgb,var(--boe-token-text-text-secondary,#566781) 92%,var(--boe-token-surface-surface-brand,#0061d5))); font-variant-numeric:tabular-nums; white-space:nowrap; }
  [part="point"] { appearance:none; position:relative; z-index:1; display:grid; grid-template-rows:11rem var(--label-lane,2rem); align-items:center; justify-items:center; gap:0; padding:0 .2rem; border:0; border-radius:3px; background:transparent; color:inherit; font:inherit; cursor:pointer; min-inline-size:0; }
  [part="point"]:hover { background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 5%,transparent); }
  [part="bar-shell"] { position:relative; display:block; block-size:100%; inline-size:100%; }
  [part="bar"] { position:absolute; inset-inline:20%; inset-block-end:var(--bar-bottom,0%); block-size:var(--bar-height,0%); border-radius:3px 3px 0 0; background:var(--boe-chart-history,#b6c2d2); }
  [part="point"][data-focal="true"] [part="bar"] { background:var(--boe-token-surface-surface-brand,#0061d5); }
  [part="point"][data-selected="true"] [part="bar"] { outline:2px solid var(--boe-chart-ink,color-mix(in srgb,var(--boe-token-text-text,#102347) 88%,var(--boe-token-surface-surface-brand,#0061d5))); outline-offset:2px; }
  [part="point"][data-missing="true"] [part="bar"] { display:none; }
  [part="point"][data-tone="accent"] [part="bar"] { background:#7c5cce; }
  [part="point"][data-tone="success"] [part="bar"] { background:#21856d; }
  [part="point-label"] { align-self:end; padding-block:.25rem; font-size:.75rem; line-height:1.2; max-inline-size:100%; overflow-wrap:anywhere; white-space:normal; text-align:center; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  [part="point-value"] { position:absolute; bottom:calc(var(--label-lane,2rem) + var(--value-position,0) * 11rem + .35rem); font-size:.75rem; font-weight:600; font-variant-numeric:tabular-nums; pointer-events:none; }
  [part="point"][data-negative="true"] [part="point-value"] { transform:translateY(calc(100% + .7rem)); }
  [part="point"]:is(:hover,:focus-visible) [part="bar"] { filter:brightness(1.12); }
`;
