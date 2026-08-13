/**
 * Deterministic demo data shared by the docs-site examples for the CLM-era
 * patterns (form-wizard, timeline, diff, work-queue, versions, lineage).
 * Everything is pinned to REFERENCE_TIME so previews and screenshots never
 * drift with the wall clock.
 */
import type { LineageNode } from "../src/patterns/lineage/types.js";
import type { TimelineEvent } from "../src/patterns/timeline/types.js";
import type { VersionNode } from "../src/patterns/versions/types.js";
import type {
  WorkItem,
  WorkItemAssignee,
  WorkQueueTransport,
} from "../src/patterns/work-queue/types.js";
import type { WizardStepConfig } from "../src/patterns/form-wizard/types.js";

export const REFERENCE_TIME = "2026-08-13T12:00:00.000Z";

export const clmTeam: WorkItemAssignee[] = [
  { id: "morgan", name: "Morgan Lee" },
  { id: "avery", name: "Avery Chen" },
  { id: "sam", name: "Sam Rivera" },
];

export const clmWorkItems: WorkItem[] = [
  {
    id: "w1",
    title: "Review MSA_Acme_v4",
    type: "review",
    status: "open",
    dueAt: "2026-08-12T09:00:00.000Z",
    assignee: { id: "morgan", name: "Morgan Lee" },
    riskLevel: "high",
    priority: "urgent",
    entityRef: { id: "c-1", label: "Acme master services agreement" },
  },
  {
    id: "w2",
    title: "Approve NDA_Globex",
    type: "approval",
    status: "in-progress",
    dueAt: "2026-08-13T20:00:00.000Z",
    assignee: { id: "avery", name: "Avery Chen" },
    priority: "high",
  },
  {
    id: "w3",
    title: "Signature: SOW_Initech",
    type: "signature",
    status: "open",
    dueAt: "2026-08-17T09:00:00.000Z",
  },
  {
    id: "w4",
    title: "Intake: Umbrella DPA",
    type: "intake",
    status: "open",
    assignee: { id: "morgan", name: "Morgan Lee" },
    riskLevel: "medium",
  },
];

/**
 * In-memory queue transport: mutations update the shared list so the
 * mutation-then-reload loop shows real state changes in the preview.
 */
export const createWorkQueueDemoTransport = (): WorkQueueTransport => {
  let items = clmWorkItems.map(item => ({ ...item }));
  const mutate = (itemId: string, patch: Partial<WorkItem>): Promise<WorkItem> => {
    items = items.map(item => (item.id === itemId ? { ...item, ...patch } : item));
    const item = items.find(entry => entry.id === itemId);
    return item ? Promise.resolve(item) : Promise.reject(new Error("Unknown work item"));
  };
  return {
    loadItems: () => Promise.resolve({ items: items.map(item => ({ ...item })) }),
    claimItem: ({ itemId, assigneeId }) =>
      mutate(itemId, {
        assignee: clmTeam.find(member => member.id === assigneeId) ?? {
          id: assigneeId,
          name: assigneeId,
        },
      }),
    reassignItem: ({ itemId, assigneeId }) =>
      mutate(itemId, {
        assignee: clmTeam.find(member => member.id === assigneeId) ?? {
          id: assigneeId,
          name: assigneeId,
        },
      }),
    completeItem: ({ itemId }) => mutate(itemId, { status: "completed" }),
    escalateItem: ({ itemId }) => mutate(itemId, { status: "escalated", riskLevel: "high" }),
  };
};

/** Trunk v1 → v2 → v2.1, a redline branch off v2, and v3 merging it back. */
export const clmVersionHistory: VersionNode[] = [
  {
    id: "v1",
    label: "v1.0",
    kind: "major",
    status: "executed",
    actor: { name: "Morgan Lee" },
    timestamp: "2026-05-01T09:00:00.000Z",
  },
  {
    id: "v2",
    label: "v2.0",
    kind: "major",
    status: "superseded",
    parents: ["v1"],
    actor: { name: "Morgan Lee" },
    timestamp: "2026-06-10T09:00:00.000Z",
  },
  {
    id: "v21",
    label: "v2.1",
    kind: "minor",
    parents: ["v2"],
    note: "Renewal dates corrected",
    timestamp: "2026-06-24T09:00:00.000Z",
  },
  {
    id: "r1",
    label: "Redline r1",
    kind: "draft",
    parents: ["v2"],
    actor: { name: "Counterparty" },
    timestamp: "2026-07-02T09:00:00.000Z",
  },
  {
    id: "r2",
    label: "Redline r2",
    kind: "draft",
    parents: ["r1"],
    actor: { name: "Avery Chen" },
    timestamp: "2026-07-15T09:00:00.000Z",
  },
  {
    id: "v3",
    label: "v3.0",
    kind: "merge",
    status: "current",
    parents: ["v21", "r2"],
    actor: { name: "Avery Chen" },
    timestamp: "2026-08-01T09:00:00.000Z",
    note: "Accepted redline round merged",
  },
];

/** Clause 4.2 fanning out through two templates into executed contracts. */
export const clmLineage: LineageNode[] = [
  {
    id: "clause-5",
    label: "Clause 4.2 v5",
    kind: "clause",
    actor: { name: "Morgan Lee" },
    timestamp: "2026-04-01T09:00:00.000Z",
  },
  {
    id: "tpl-2026",
    label: "Template 2026",
    kind: "template",
    parents: [{ id: "clause-5", deviation: "none" }],
    timestamp: "2026-05-01T09:00:00.000Z",
  },
  {
    id: "tpl-2026-emea",
    label: "Template 2026 EMEA",
    kind: "template",
    parents: [{ id: "clause-5", deviation: "minor", note: "GDPR annex added" }],
    timestamp: "2026-05-15T09:00:00.000Z",
  },
  {
    id: "msa-acme",
    label: "MSA_Acme §4.2",
    kind: "contract",
    parents: [{ id: "tpl-2026", deviation: "major", note: "Liability cap reworded" }],
    timestamp: "2026-07-20T09:00:00.000Z",
  },
  {
    id: "nda-globex",
    label: "NDA_Globex §4.2",
    kind: "contract",
    parents: [{ id: "tpl-2026-emea", deviation: "none" }],
    timestamp: "2026-08-02T09:00:00.000Z",
  },
];

export const clmProvenanceChain: LineageNode[] = [
  clmLineage[0]!,
  clmLineage[1]!,
  clmLineage[3]!,
];

export const clmTimelineEvents: TimelineEvent[] = [
  {
    id: "e1",
    action: "Contract executed",
    actor: { name: "Avery Chen" },
    summary: "MSA_Acme_v4 fully signed; renewal reminder scheduled.",
    timestamp: "2026-08-12T16:20:00.000Z",
    tone: "success",
    badge: "Signature complete",
    evidence: [{ id: "ev1", label: "Signed PDF" }],
  },
  {
    id: "e2",
    action: "Legal approval granted",
    actor: { name: "Morgan Lee" },
    summary: "Liability cap deviation approved with note.",
    timestamp: "2026-08-11T10:05:00.000Z",
    tone: "brand",
    correlationId: "wf-9042",
  },
  {
    id: "e3",
    action: "Policy check flagged clause 4.2",
    summary: "Major deviation from Template 2026 detected by review.",
    timestamp: "2026-08-10T08:40:00.000Z",
    tone: "warning",
    badge: "Deviation: major",
    evidence: [{ id: "ev2", label: "Clause comparison" }],
  },
];

export const clmClauseBefore = `4.2 Limitation of Liability.
Neither party's aggregate liability shall exceed
the fees paid in the twelve (12) months preceding
the claim.
Excluded: breaches of confidentiality.`;

export const clmClauseAfter = `4.2 Limitation of Liability.
Neither party's aggregate liability shall exceed
two times (2x) the fees paid in the twelve (12)
months preceding the claim.
Excluded: breaches of confidentiality and
indemnification obligations.`;

export const clmIntakeSteps: WizardStepConfig[] = [
  { id: "parties", label: "Parties", description: "Who is contracting" },
  { id: "terms", label: "Key terms", description: "Value, dates, renewal" },
  { id: "review", label: "Review & submit", description: "Confirm the request" },
];
