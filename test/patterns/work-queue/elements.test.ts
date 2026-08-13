import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkQueueController } from "../../../src/patterns/work-queue/controller.js";
import { WorkQueue } from "../../../src/patterns/work-queue/work-queue.js";
import { WorkloadBoard } from "../../../src/patterns/work-queue/workload-board.js";
import type {
  WorkItem,
  WorkQueueTransport,
} from "../../../src/patterns/work-queue/types.js";

WorkQueue.register();
WorkloadBoard.register();

const REFERENCE = "2026-08-13T12:00:00.000Z";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const items: WorkItem[] = [
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
  },
  { id: "w3", title: "Signature: SOW_Initech", type: "signature", status: "open" },
];

const createTransport = (overrides: Partial<WorkQueueTransport> = {}): WorkQueueTransport => ({
  loadItems: vi.fn().mockResolvedValue({ items }),
  ...overrides,
});

const mountQueue = async (
  transport: WorkQueueTransport,
  configure?: (element: WorkQueue) => void,
): Promise<WorkQueue> => {
  const element = document.createElement("box-work-queue") as WorkQueue;
  element.transport = transport;
  element.token = "token";
  element.referenceTime = REFERENCE;
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

const mountBoard = async (
  transport: WorkQueueTransport,
  configure?: (element: WorkloadBoard) => void,
): Promise<WorkloadBoard> => {
  const element = document.createElement("box-workload-board") as WorkloadBoard;
  element.transport = transport;
  element.token = "token";
  element.referenceTime = REFERENCE;
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-work-queue", () => {
  it("groups rows into urgency buckets in order", async () => {
    const element = await mountQueue(createTransport());

    const buckets = Array.from(
      element.shadowRoot?.querySelectorAll('[part="bucket"]') ?? [],
    ).map(section => (section as HTMLElement).dataset.bucket);
    expect(buckets).toEqual(["overdue", "today", "none"]);

    const overdueRow = element.shadowRoot?.querySelector('[part="row"][data-bucket="overdue"]');
    expect(overdueRow?.textContent).toContain("Review MSA_Acme_v4");
    expect(overdueRow?.textContent).toContain("Overdue ·");
    expect(overdueRow?.textContent).toContain("Acme master services agreement");
  });

  it("offers Claim only on unassigned open items when assignee-id is set", async () => {
    const claimItem = vi.fn().mockResolvedValue(items[2]);
    const element = await mountQueue(createTransport({ claimItem }), el => {
      el.assigneeId = "morgan";
    });

    const claims = element.shadowRoot?.querySelectorAll('[data-action="claim"]') ?? [];
    expect(claims).toHaveLength(1);
    (claims[0] as HTMLButtonElement).click();
    await flush();

    expect(claimItem).toHaveBeenCalledWith({ itemId: "w3", assigneeId: "morgan", token: "token" });
  });

  it("wires complete/escalate actions and surfaces reassign as intent", async () => {
    const completeItem = vi.fn().mockResolvedValue({ ...items[0], status: "completed" });
    const reassignItem = vi.fn();
    const element = await mountQueue(createTransport({ completeItem, reassignItem }));
    const reassignRequested = vi.fn();
    element.addEventListener("reassign-requested", reassignRequested);

    const overdueRow = element.shadowRoot?.querySelector('[part="row"][data-item-id="w1"]');
    (overdueRow?.querySelector('[data-action="complete"]') as HTMLButtonElement).click();
    await flush();
    expect(completeItem).toHaveBeenCalledWith({ itemId: "w1", token: "token" });

    const row = element.shadowRoot?.querySelector('[part="row"][data-item-id="w1"]');
    (row?.querySelector('[data-action="reassign"]') as HTMLButtonElement).click();
    expect(reassignItem).not.toHaveBeenCalled();
    expect(reassignRequested.mock.calls[0]?.[0]?.detail.item.id).toBe("w1");
  });

  it("emits item-selected from the row title", async () => {
    const element = await mountQueue(createTransport());
    const selected = vi.fn();
    element.addEventListener("item-selected", selected);

    (element.shadowRoot?.querySelector('[part="row-title"]') as HTMLButtonElement).click();

    expect(selected.mock.calls[0]?.[0]?.detail.item.id).toBe("w1");
  });

  it("escapes hostile wire values in status/risk/priority markup", async () => {
    const hostile: WorkItem = {
      id: "wx",
      title: "Injected row",
      type: "review",
      status: '"><img data-pwn src=x>' as WorkItem["status"],
      riskLevel: '"><script data-pwn>alert(1)</script>' as WorkItem["riskLevel"],
      priority: "<b data-pwn>urgent</b>" as WorkItem["priority"],
    };
    const element = await mountQueue(
      createTransport({ loadItems: vi.fn().mockResolvedValue({ items: [hostile] }) }),
    );

    expect(element.shadowRoot?.querySelector("[data-pwn]")).toBeNull();
    // The escaped attribute round-trips to the original wire value.
    expect(
      element.shadowRoot?.querySelector('[part="row"]')?.getAttribute("data-status"),
    ).toBe('"><img data-pwn src=x>');
  });

  it("falls back to its owned session when a shared controller is cleared", async () => {
    const sharedTransport = createTransport();
    const shared = new WorkQueueController({ token: "token", transport: sharedTransport });
    await shared.connect();

    const ownTransport = createTransport({
      loadItems: vi.fn().mockResolvedValue({ items: [items[1]!] }),
    });
    const element = await mountQueue(ownTransport, el => {
      el.queueController = shared;
    });
    expect(ownTransport.loadItems).not.toHaveBeenCalled();
    expect(element.shadowRoot?.textContent).toContain("Review MSA_Acme_v4");

    element.queueController = null;
    await flush();

    expect(ownTransport.loadItems).toHaveBeenCalledTimes(1);
    expect(element.shadowRoot?.textContent).toContain("Approve NDA_Globex");
    // Clearing must not destroy the shared session it never owned.
    expect(shared.getState().connected).toBe(true);
  });

  it("renders load failures as an alert", async () => {
    const element = await mountQueue(
      createTransport({ loadItems: vi.fn().mockRejectedValue(new Error("backend down")) }),
    );

    const error = element.shadowRoot?.querySelector('[part="error"]');
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.textContent).toBe("backend down");
  });
});

describe("box-workload-board", () => {
  it("renders assignee lanes with counts, overdue signals, and an unassigned lane", async () => {
    const element = await mountBoard(createTransport(), el => {
      el.team = [
        { id: "morgan", name: "Morgan Lee" },
        { id: "sam", name: "Sam Rivera" },
      ];
    });

    const lanes = Array.from(element.shadowRoot?.querySelectorAll('[part="lane"]') ?? []);
    expect(lanes.map(lane => lane.getAttribute("aria-label"))).toEqual([
      "Morgan Lee",
      "Sam Rivera",
      "Avery Chen",
      "Unassigned",
    ]);
    expect(lanes[0]?.querySelector('[part="lane-overdue"]')?.textContent).toBe("1 overdue");
    // Spare capacity is visible: an empty roster lane renders with zero.
    expect(lanes[1]?.querySelector('[part="lane-count"]')?.textContent).toBe("0");
  });

  it("summarizes totals in the header strip", async () => {
    const element = await mountBoard(createTransport());

    const chips = Array.from(element.shadowRoot?.querySelectorAll('[part="summary-chip"]') ?? []).map(
      chip => chip.textContent,
    );
    expect(chips).toEqual(["3 items", "1 overdue", "1 in progress", "0 done"]);
    expect(
      element.shadowRoot
        ?.querySelector('[part="summary-chip"][data-metric="overdue"]')
        ?.getAttribute("data-nonzero"),
    ).toBe("true");
  });

  it("flags lanes over the wip-limit", async () => {
    const loaded = [
      ...items,
      {
        id: "w4",
        title: "Review DPA_Acme",
        type: "review",
        status: "open",
        assignee: { id: "morgan", name: "Morgan Lee" },
      } satisfies WorkItem,
    ];
    const element = await mountBoard(
      createTransport({ loadItems: vi.fn().mockResolvedValue({ items: loaded }) }),
      el => {
        el.wipLimit = 1;
      },
    );

    const flagged = Array.from(
      element.shadowRoot?.querySelectorAll('[part="lane"][data-over-capacity="true"]') ?? [],
    );
    expect(flagged.map(lane => lane.getAttribute("aria-label"))).toEqual(["Morgan Lee"]);
  });

  it("supports status lanes", async () => {
    const element = await mountBoard(createTransport(), el => {
      el.laneBy = "status";
    });

    const lanes = Array.from(element.shadowRoot?.querySelectorAll('[part="lane"]') ?? []);
    expect(lanes.map(lane => lane.getAttribute("aria-label"))).toEqual([
      "Open",
      "In progress",
      "Escalated",
      "Completed",
    ]);
    const openLane = lanes[0];
    expect(openLane?.querySelectorAll('[part="card"]')).toHaveLength(2);
  });

  it("emits reassign-requested and item-selected from cards", async () => {
    const element = await mountBoard(createTransport({ reassignItem: vi.fn() }));
    const reassignRequested = vi.fn();
    const selected = vi.fn();
    element.addEventListener("reassign-requested", reassignRequested);
    element.addEventListener("item-selected", selected);

    (element.shadowRoot?.querySelector('[part="card-reassign"]') as HTMLButtonElement).click();
    (element.shadowRoot?.querySelector('[part="card-title"]') as HTMLButtonElement).click();

    expect(reassignRequested).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenCalledTimes(1);
  });

  it("escapes hostile wire values on cards", async () => {
    const hostile: WorkItem = {
      id: "wx",
      title: "Injected card",
      type: "review",
      status: '"><img data-pwn src=x>' as WorkItem["status"],
      riskLevel: '"><script data-pwn>alert(1)</script>' as WorkItem["riskLevel"],
    };
    const element = await mountBoard(
      createTransport({ loadItems: vi.fn().mockResolvedValue({ items: [hostile] }) }),
    );

    expect(element.shadowRoot?.querySelector("[data-pwn]")).toBeNull();
    expect(
      element.shadowRoot?.querySelector('[part="card"]')?.getAttribute("data-status"),
    ).toBe('"><img data-pwn src=x>');
  });

  it("shares one session between the queue and the board via queueController", async () => {
    const transport = createTransport();
    const controller = new WorkQueueController({ token: "token", transport });
    await controller.connect();

    const queue = document.createElement("box-work-queue") as WorkQueue;
    queue.referenceTime = REFERENCE;
    queue.queueController = controller;
    const board = document.createElement("box-workload-board") as WorkloadBoard;
    board.referenceTime = REFERENCE;
    board.queueController = controller;
    document.body.append(queue, board);
    await flush();

    expect(transport.loadItems).toHaveBeenCalledTimes(1);
    expect(queue.shadowRoot?.textContent).toContain("Review MSA_Acme_v4");
    expect(board.shadowRoot?.textContent).toContain("Review MSA_Acme_v4");

    // Detaching a non-owning element must not kill the shared session.
    queue.remove();
    await controller.reload();
    await flush();
    expect(board.shadowRoot?.textContent).toContain("Approve NDA_Globex");
  });
});
