/**
 * Deterministic demo data shared by the docs-site examples for the CLM-era
 * patterns (form-wizard, timeline, diff, work-queue, versions, lineage,
 * agent-chat, audit). Everything is pinned to REFERENCE_TIME so previews and
 * screenshots never drift with the wall clock.
 */
import type {
  AgentChatTransport,
  AgentSendRequest,
} from "../src/patterns/agent-chat/types.js";
import type { AuditEvent } from "../src/patterns/audit/types.js";
import type { CommandDescriptor } from "../src/components/overlays/command-types.js";
import type { NotificationItem } from "../src/patterns/notifications/types.js";
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

/**
 * The audit trail behind the same contract the other demos use. Deliberately
 * spread across several UTC days, actors, and action types so the grouping
 * dimensions, the facet counts, and the density heatmap all have something
 * real to show; `wf-9042` threads one workflow run for the drill-down.
 */
export const clmAuditEvents: AuditEvent[] = [
  {
    id: "au1",
    action: "Contract executed",
    actor: { name: "Avery Chen" },
    summary: "MSA_Acme_v4 fully signed; renewal reminder scheduled.",
    timestamp: "2026-08-13T09:12:00.000Z",
    tone: "success",
    badge: "Signature complete",
    correlationId: "wf-9042",
    evidence: [{ id: "aev1", label: "Signed PDF" }],
  },
  {
    id: "au2",
    action: "Approval granted",
    actor: { name: "Morgan Lee" },
    summary: "Liability cap deviation approved with note.",
    timestamp: "2026-08-13T08:05:00.000Z",
    tone: "brand",
    correlationId: "wf-9042",
  },
  {
    id: "au3",
    action: "Policy check flagged clause 4.2",
    actor: { name: "Policy engine" },
    summary: "Major deviation from Template 2026 detected.",
    timestamp: "2026-08-12T16:40:00.000Z",
    tone: "warning",
    badge: "Deviation: major",
    correlationId: "wf-9042",
    evidence: [{ id: "aev2", label: "Clause comparison", href: "#diff-viewer" }],
  },
  {
    id: "au4",
    action: "Redlined clause 4.2",
    actor: { name: "Sam Rivera" },
    summary: "Cap raised to 2x with confidentiality carve-out.",
    timestamp: "2026-08-12T11:20:00.000Z",
    correlationId: "wf-8871",
  },
  {
    id: "au5",
    action: "Approval granted",
    actor: { name: "Morgan Lee" },
    summary: "Commercial terms cleared for signature.",
    timestamp: "2026-08-11T14:02:00.000Z",
    tone: "brand",
    correlationId: "wf-8871",
  },
  {
    id: "au6",
    action: "Access granted",
    actor: { name: "Avery Chen" },
    summary: "External counsel added as reviewer.",
    timestamp: "2026-08-11T09:30:00.000Z",
    badge: "Permission change",
  },
  {
    id: "au7",
    action: "Redlined clause 4.2",
    actor: { name: "Sam Rivera" },
    timestamp: "2026-08-07T13:15:00.000Z",
    correlationId: "wf-8712",
  },
  {
    id: "au8",
    action: "Policy check flagged clause 4.2",
    actor: { name: "Policy engine" },
    timestamp: "2026-08-07T13:10:00.000Z",
    tone: "warning",
    correlationId: "wf-8712",
  },
  {
    id: "au9",
    action: "Intake submitted",
    actor: { name: "Jordan Blake" },
    summary: "Acme Corp master services agreement requested.",
    timestamp: "2026-08-03T10:00:00.000Z",
  },
  {
    id: "au10",
    action: "Imported from legacy archive",
    summary: "Migrated from the 2024 repository; actor not recorded.",
    timestamp: "2026-07-29T06:00:00.000Z",
  },
];

const AGENT_REPLY =
  "Clause 4.2 in MSA_Acme_v4 caps liability at 2x fees, which deviates from " +
  "the 1x cap in Template 2026. The deviation was approved by Morgan Lee on " +
  "Aug 11, so the executed contract is compliant — but the template itself " +
  "has now drifted from three active agreements.";

/**
 * A scripted agent session: streams the reply a few words at a time, then
 * attaches a citation and a human-in-the-loop proposal, and resolves that
 * proposal through the optional capability so Approve/Reject render.
 *
 * The pacing is a real timer, so the preview shows the streaming caret and
 * the composer staying live mid-reply rather than a finished transcript.
 */
export const createAgentChatDemoTransport = (): AgentChatTransport => ({
  async sendMessage(request: AgentSendRequest): Promise<void> {
    const words = AGENT_REPLY.split(" ");
    for (let index = 0; index < words.length; index += 3) {
      if (request.signal?.aborted) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 55));
      request.onEvent({ kind: "delta", text: `${words.slice(index, index + 3).join(" ")} ` });
    }

    request.onEvent({
      kind: "citation",
      citation: { id: "c1", label: "MSA_Acme_v4 §4.2", href: "#lineage-graph" },
    });
    request.onEvent({
      kind: "citation",
      citation: { id: "c2", label: "Template 2026 §4.2", href: "#diff-viewer" },
    });
    request.onEvent({
      kind: "proposal",
      proposal: {
        id: "p1",
        title: "Update Template 2026 to the 2x cap",
        summary: "Aligns the template with the three agreements that already deviate.",
        params: [
          { label: "Current cap", value: "1x fees" },
          { label: "Proposed cap", value: "2x fees" },
          { label: "Affected agreements", value: "3" },
        ],
      },
    });
  },

  async resolveAction({ proposalId, decision, note }) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      id: proposalId,
      title: "Update Template 2026 to the 2x cap",
      summary: "Aligns the template with the three agreements that already deviate.",
      params: [
        { label: "Current cap", value: "1x fees" },
        { label: "Proposed cap", value: "2x fees" },
        { label: "Affected agreements", value: "3" },
      ],
      decision,
      ...(note !== undefined ? { note } : {}),
    };
  },
});

/** Global actions a CLM workbench would actually offer. */
export const clmCommands: CommandDescriptor[] = [
  { id: "new-intake", label: "New intake request", group: "Create", shortcut: "⌘N", description: "Start a contract request", keywords: ["contract", "request"] },
  { id: "new-clause", label: "New clause", group: "Create", description: "Add a clause to the library" },
  { id: "compare-versions", label: "Compare versions", group: "Review", shortcut: "⌘D", description: "Diff two versions of a contract", keywords: ["diff", "redline"] },
  { id: "open-lineage", label: "Open clause lineage", group: "Review", description: "Trace a clause through the estate" },
  { id: "approve-request", label: "Approve request", group: "Review", description: "Record a second-line approval" },
  { id: "escalate", label: "Escalate to legal", group: "Review", description: "Route to the legal queue" },
  { id: "export-audit", label: "Export audit log", group: "Reporting", description: "Download the filtered trail as CSV" },
  { id: "open-workload", label: "Open workload board", group: "Reporting", description: "Team capacity by assignee" },
  { id: "archive", label: "Archive contract", description: "Only available on executed contracts", disabled: true },
  { id: "settings", label: "Open settings" },
];

/** The triage queue behind the bell, spread across types and read states. */
export const clmNotifications: NotificationItem[] = [
  {
    id: "nt1",
    title: "Approval needed on MSA_Acme_v4",
    type: "approval",
    summary: "Second-line approval is blocking execution.",
    actor: { name: "Morgan Lee" },
    timestamp: "2026-08-13T09:12:00.000Z",
    tone: "warning",
    entityRef: { id: "msa-acme", label: "MSA_Acme_v4", href: "#patterns/audit-log" },
  },
  {
    id: "nt2",
    title: "Approval needed on NDA_Globex",
    type: "approval",
    actor: { name: "Avery Chen" },
    timestamp: "2026-08-13T08:40:00.000Z",
  },
  {
    id: "nt3",
    title: "SLA breach: clause review overdue by 2 days",
    type: "sla-breach",
    summary: "Clause 4.2 review passed its due date on Aug 11.",
    timestamp: "2026-08-13T07:00:00.000Z",
    tone: "error",
    entityRef: { id: "clause-42", label: "Clause 4.2", href: "#patterns/lineage-graph" },
  },
  {
    id: "nt4",
    title: "Sam Rivera mentioned you on clause 4.2",
    type: "mention",
    actor: { name: "Sam Rivera" },
    summary: "\u201cCan you confirm the 2x cap is signed off?\u201d",
    timestamp: "2026-08-12T16:20:00.000Z",
    read: true,
  },
  {
    id: "nt5",
    title: "Contract executed: MSA_Initech",
    type: "approval",
    actor: { name: "Avery Chen" },
    timestamp: "2026-08-12T11:05:00.000Z",
    tone: "success",
    read: true,
  },
];
