/** Decisions are shown separately from execution so approval cannot imply success. */
export const statusDemoHtml = `<div style="display:grid;gap:16px">
  <section aria-label="Execution states" style="display:flex;flex-wrap:wrap;gap:16px">
    ${[["pending", "Pending"], ["active", "In progress"], ["done", "Done"], ["warning", "Done with a warning"], ["failed", "Failed"], ["skipped", "Skipped"]].map(([kind, label]) => `<span><box-status-icon kind="${kind}" aria-hidden="true"></box-status-icon> ${label}</span>`).join("")}
  </section>
  <section aria-label="Decision states" style="display:flex;flex-wrap:wrap;gap:16px">
    <span><box-status-icon kind="approved" aria-hidden="true"></box-status-icon> Approved</span>
    <span><box-status-icon kind="rejected" aria-hidden="true"></box-status-icon> Rejected</span>
  </section>
  <p>Approval permits an action. Its execution can still fail.</p>
</div>`;
