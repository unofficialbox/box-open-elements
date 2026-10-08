# Drawer dismissal

`hide-close-button` removes only the built-in header Close control. Keep a
visible, keyboard-operable footer action so the drawer is still dismissible.
The default drawer continues to show its header Close button.

```html
<box-drawer id="connection-details" heading="Connection details" hide-close-button>
  <p>Review the Box connection before continuing.</p>
  <box-button slot="footer" label="Done" tone="primary" id="details-done"></box-button>
</box-drawer>
<script type="module">
  import "@unofficialbox/box-open-elements/drawer";
  import "@unofficialbox/box-open-elements/button";
  const drawer = document.querySelector("#connection-details");
  document.querySelector("#details-done")?.addEventListener("click", () => drawer.close());
  drawer.show();
</script>
```

```tsx
import { useState } from "react";
import { Button, Drawer } from "@unofficialbox/box-open-elements-react";

function ConnectionDetails() {
  const [open, setOpen] = useState(true);
  return <Drawer open={open} heading="Connection details" hideCloseButton
    onOpenChanged={event => setOpen(event.detail.open)}>
    <p>Review the Box connection before continuing.</p>
    <Button slot="footer" label="Done" tone="primary" onClick={() => setOpen(false)} />
  </Drawer>;
}
```

Escape and backdrop activation still emit the cancelable `dismiss` event with
`source: "escape"` or `"backdrop"`. Call `preventDefault()` there to keep the
drawer open, for example while confirming unsaved changes. Programmatic
`close()` bypasses that guard because the host chose to close it. Focus returns
to the previously focused control after closing; when the header button is
hidden, initial focus goes to the drawer surface. The host can then move focus
to its preferred control.
