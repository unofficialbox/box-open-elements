import type { StoryModule } from "../metadata.js";

const inviteCollaboratorsModal: StoryModule = {
  title: "Patterns/Share/Invite Collaborators Modal",
  meta: {
    id: "invite-collaborators-modal",
    tag: "box-invite-collaborators-modal",
    shortDescription: "A modal workflow for inviting collaborators.",
    docsDescription: "Open the modal with `open`; set `item-id`, optional `heading`, and an invite transport property in app code.",
    sourceSnippet: `<box-invite-collaborators-modal item-id="42" heading="Invite people" open></box-invite-collaborators-modal>`,
    referenceRows: [
      { kind: "attribute", name: "open", type: "boolean", description: "Shows the modal dialog." },
      { kind: "attribute", name: "item-id", type: "string", description: "Item being shared." },
      { kind: "attribute", name: "heading", type: "string", description: "Dialog heading." },
      { kind: "attribute", name: "submit-label", type: "string", description: "Submit button label." },
      { kind: "property", name: "transport", type: "InviteCollaboratorsTransport", description: "Transport used to submit invites." },
      { kind: "property", name: "roles", type: "InviteRole[]", description: "Role choices for invite recipients." },
      { kind: "event", name: "submitted", description: "Emitted after a successful invite submit." },
      { kind: "event", name: "cancel", description: "Emitted when the modal is dismissed." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-invite-collaborators-modal item-id="42" heading="Invite people" submit-label="Send invites" open></box-invite-collaborators-modal>`,
      note: "A transport property is required for submission; the open attribute exposes the static modal form for reference.",
    },
  ],
};

export default inviteCollaboratorsModal;
