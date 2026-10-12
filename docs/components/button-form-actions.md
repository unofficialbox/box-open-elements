# Button form actions

A `box-button` with `type="submit"` or `type="reset"` forwards its native
button activation to the associated form. Its composed click propagates once;
host, native-target and ancestor listeners can cancel that action with
`event.preventDefault()`. `stopPropagation()` alone does not cancel it.

The form action runs in the next task after click propagation, so a host veto can
be observed. Code that calls the shadow button's `.click()` synchronously can
await the next task before inspecting the form action. Native form validation
and cancelable submit/reset events still apply.

The action checks the current type, form association, connection, disabled
state (including native disabled fieldsets), and loading state after listeners
finish. Detaching, disabling or marking the button loading during a click
blocks the action. A detach/reconnect also discards the old activation. Nested click events keep their own cancellation state.
