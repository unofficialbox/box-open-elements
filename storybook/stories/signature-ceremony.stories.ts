import type { StoryModule } from "../metadata.js";

const signatureCeremony: StoryModule = {
  title: "Patterns/Signature/Signature Ceremony",
  meta: {
    id: "signature-ceremony",
    tag: "box-signature-ceremony",
    shortDescription: "Party-oriented signing progress: who signs, in what order, who can act now.",
    docsDescription:
      "The signature surface for a contract out for signing. `resolveCeremony` is pure and DOM-free, so the rules that decide who may sign are testable on their own and a host can drive its own surface — or its reminder emails — from the same function, rather than reimplementing the ordering and drifting from what the card shows. Three rules apply in priority order. **A decline stops the ceremony**: nobody who has not already signed is shown as able to act, not even in parallel mode where they otherwise all could. That is the rule worth being strict about — a declined document is dead until the host revives it, and inviting someone to sign against it wastes their time and can produce a signature on a document the counterparty has already refused. **Sequential grants exactly one turn**, to the first unsigned party, so a later party can never appear actionable before an earlier one has signed. **Parallel grants every turn at once.** The state model carries the distinction: `awaiting` means can act now, `waiting` means their turn has not come — or the ceremony has stopped and will never reach them — and only `awaiting` should ever carry a sign-now affordance. The card is read-only by design, because signing happens in the signature provider's own flow and a button here would have to duplicate that flow's authority; every state is rendered in words as well as colour.",
    sourceSnippet: `<box-signature-ceremony heading="Signatures"></box-signature-ceremony>`,
    referenceRows: [
      { kind: "attribute", name: "signatories", type: "json", description: "Signatory records: `id`, `name`, optional `role`, `signedAt`, `declinedAt`, `declineReason`." },
      { kind: "attribute", name: "mode", type: "string", description: "'sequential' (default) routes one party at a time; 'parallel' sends to everyone at once." },
      { kind: "attribute", name: "heading", type: "string", description: "Card title and its accessible name. Defaults to 'Signatures'." },
      { kind: "property", name: "resolution", type: "CeremonyResolution", description: "Read-only: statuses, ceremony status, signed count, and the parties who may act now." },
    ],
  },
  variants: [
    {
      name: "Sequential, mid-ceremony",
      html: `<box-signature-ceremony heading="Signatures — MSA_Acme v4"></box-signature-ceremony>`,
      note: "Exactly one party is awaiting; those behind read 'Not yet their turn' rather than looking actionable.",
    },
    {
      name: "Parallel",
      html: `<box-signature-ceremony heading="Signatures — MSA_Acme v4" mode="parallel"></box-signature-ceremony>`,
      note: "The same roster sent to everyone at once: every unsigned party is awaiting.",
    },
    {
      name: "Declined",
      html: `<box-signature-ceremony heading="Signatures — MSA_Acme v4"></box-signature-ceremony>`,
      note: "A refusal stops the ceremony: the party behind the decline is not invited to sign a document that is already dead.",
    },
  ],
};

export default signatureCeremony;
