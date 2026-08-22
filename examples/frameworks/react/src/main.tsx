import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Button,
  Dialog,
  ExplorerSelectionController,
  useExplorerSelectionController,
} from "@unofficialbox/box-open-elements-react";
import "../../shared.css";

const selectionController = new ExplorerSelectionController();
selectionController.setItems([{ id: "alpha" }, { id: "beta" }]);

const App = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const selection = useExplorerSelectionController(selectionController);

  return (
    <main>
      <h1>React adapter interop</h1>
      <p data-testid="selection">
        Selected: {selection.selectedItemIds.join(", ") || "None"}
      </p>
      <div className="fields">
        <Button
          data-testid="toggle-alpha"
          label="Toggle Alpha"
          tone="neutral"
          onClick={() => selectionController.toggleSelection("alpha")}
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
        heading="React controlled dialog"
        description="The custom element owns focus; React owns open state."
        onOpenChanged={event => setDialogOpen(event.detail.open)}
      >
        Escape closes this overlay and restores focus.
      </Dialog>
    </main>
  );
};

createRoot(document.querySelector("#app")!).render(<App />);
