/**
 * Signature ceremony model and the pure engine that resolves it.
 *
 * DOM-free and deterministic, so the rules that decide *who may sign now* are
 * testable on their own and a host can drive its own signing surface — or its
 * server-side reminders — from the same function.
 */

/**
 * `sequential` routes the document one party at a time, in order.
 * `parallel` sends it to everyone at once.
 */
export type SignatureMode = "sequential" | "parallel";

/**
 * `awaiting` means this party can act **now**. `waiting` means their turn has
 * not come — or the ceremony has stopped and will never reach them. The
 * distinction is the whole point of the component: only `awaiting` should ever
 * carry a sign-now affordance.
 */
export type SignatoryState = "signed" | "declined" | "awaiting" | "waiting";

export type CeremonyStatus = "completed" | "in-progress" | "declined";

export interface Signatory {
  id: string;
  name: string;
  /** Capacity they sign in — "Counterparty", "General Counsel". */
  role?: string;
  email?: string;
  /** ISO timestamp. Present means signed. */
  signedAt?: string;
  /** ISO timestamp. Present means refused, which stops the ceremony. */
  declinedAt?: string;
  declineReason?: string;
}

export interface SignatoryStatus {
  signatory: Signatory;
  state: SignatoryState;
  /** 1-based: the signing position in sequential mode, display order otherwise. */
  order: number;
}

export interface CeremonyResolution {
  statuses: SignatoryStatus[];
  status: CeremonyStatus;
  signedCount: number;
  total: number;
  /** Parties who may act right now. Empty once the ceremony is done or stopped. */
  awaiting: Signatory[];
}

/**
 * Resolve every party's state from the signing order and what has happened.
 *
 * Three rules, in priority order:
 *
 * 1. **A decline stops the ceremony.** Nobody who has not already signed
 *    becomes `awaiting` — not even in parallel mode, where they otherwise
 *    could all act. This is the rule worth being strict about: a declined
 *    document is dead until the host revives it, and showing someone a
 *    sign-now affordance for it wastes their time and produces a signature
 *    against a document the counterparty has already refused.
 * 2. **Sequential grants exactly one turn.** The first unsigned party is
 *    `awaiting`; everyone behind them is `waiting`. A later party can never
 *    appear actionable before an earlier one has signed.
 * 3. **Parallel grants every turn at once** — all unsigned parties are
 *    `awaiting`.
 */
export const resolveCeremony = (
  signatories: readonly Signatory[],
  mode: SignatureMode = "sequential",
): CeremonyResolution => {
  const declined = signatories.some(signatory => signatory.declinedAt);
  const signedCount = signatories.filter(
    signatory => signatory.signedAt && !signatory.declinedAt,
  ).length;

  let turnTaken = false;
  const statuses = signatories.map((signatory, index): SignatoryStatus => {
    const order = index + 1;
    if (signatory.declinedAt) {
      return { signatory, state: "declined", order };
    }
    if (signatory.signedAt) {
      return { signatory, state: "signed", order };
    }
    // Rule 1: a stopped ceremony grants no turns at all.
    if (declined) {
      return { signatory, state: "waiting", order };
    }
    if (mode === "parallel") {
      return { signatory, state: "awaiting", order };
    }
    // Rule 2: sequential hands out a single turn, to the first unsigned party.
    if (turnTaken) {
      return { signatory, state: "waiting", order };
    }
    turnTaken = true;
    return { signatory, state: "awaiting", order };
  });

  const status: CeremonyStatus = declined
    ? "declined"
    : signatories.length > 0 && signedCount === signatories.length
      ? "completed"
      : "in-progress";

  return {
    statuses,
    status,
    signedCount,
    total: signatories.length,
    awaiting: statuses
      .filter(entry => entry.state === "awaiting")
      .map(entry => entry.signatory),
  };
};

/** Human phrasing for the ceremony as a whole. */
export const formatCeremonySummary = (resolution: CeremonyResolution): string => {
  if (resolution.total === 0) {
    return "No signatories";
  }
  if (resolution.status === "declined") {
    return "Declined";
  }
  if (resolution.status === "completed") {
    return "Fully executed";
  }
  return `${String(resolution.signedCount)} of ${String(resolution.total)} signed`;
};

/** Attribute payloads are author input — validate every record. */
export const isSignatoryRecord = (value: unknown): value is Signatory => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const signatory = value as Record<string, unknown>;
  return (
    typeof signatory.id === "string" &&
    signatory.id.length > 0 &&
    typeof signatory.name === "string" &&
    signatory.name.length > 0
  );
};
