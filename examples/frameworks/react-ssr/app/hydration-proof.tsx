"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  useExplorerSelectionController,
} from "@unofficialbox/box-open-elements-react";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

const createSelectionController = (): ExplorerSelectionController => {
  const controller = new ExplorerSelectionController();
  controller.setItems([{ id: "alpha" }, { id: "beta" }]);
  return controller;
};

export function HydrationProof() {
  const [controller] = useState(createSelectionController);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const selection = useExplorerSelectionController(controller);

  useEffect(() => {
    registerBoxDefaultDesignSystem({ setActive: true });
    applyDesignTokens(document.documentElement, "box-default");
    setHydrated(true);
  }, []);

  return (
    <main>
      <h1>React SSR adapter interop</h1>
      <p data-testid="hydration">{hydrated ? "Hydrated" : "Server rendered"}</p>
      <p data-testid="selection">
        Selected: {selection.selectedItemIds.join(", ") || "None"}
      </p>
      <div className="actions">
        <Button
          data-testid="toggle-alpha"
          label="Toggle Alpha"
          tone="neutral"
          onClick={() => controller.toggleSelection("alpha")}
        />
        <Button
          data-testid="open-dialog"
          label="Open dialog"
          tone="primary"
          onClick={() => setDialogOpen(true)}
        />
      </div>
      <Dialog
        data-testid="dialog"
        open={dialogOpen}
        heading="Hydrated dialog"
        description="Rendered on the server and upgraded on the client."
        onOpenChanged={event => setDialogOpen(event.detail.open)}
      >
        Escape closes this overlay and restores focus.
      </Dialog>
    </main>
  );
}
