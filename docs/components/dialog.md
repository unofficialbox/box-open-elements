# Dialog confirmation states

`box-dialog` keeps Cancel and Escape available while confirmation is disabled
or waiting on a prerequisite. `confirm-disabled` prevents activation without a
busy state. `confirm-busy` disables confirmation and applies `aria-busy` to the
confirm control; `confirm-busy-label` replaces only that control's text, not the
dialog's accessible heading. Clearing the flags enables confirmation in place.

```ts
import { Dialog } from "@unofficialbox/box-open-elements/dialog";

const dialog = document.querySelector("box-dialog") as Dialog;
dialog.confirmBusy = true;
dialog.confirmBusyLabel = "Waiting for setup";
dialog.show();
await finishSetup();
dialog.confirmBusy = false;
```

React hosts use the same controlled state:

```tsx
import { Dialog } from "@unofficialbox/box-open-elements-react";

<Dialog
  open={open}
  heading="Start deployment?"
  confirmLabel="Start deployment"
  confirmBusy={setupPending}
  confirmBusyLabel="Waiting for setup"
  confirmDisabled={!targetsValid}
  onConfirm={() => startDeployment()}
  onOpenChanged={event => setOpen(event.detail.open)}
/>
```

See the **Waiting for setup** variant in the live Dialog docs for a simulated
prerequisite completing while the dialog remains open.
