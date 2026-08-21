import { describe, expect, it, vi } from "vitest";

import { WorkQueueController } from "../../../src/patterns/work-queue/controller.js";
import {
  resolveDueBucket,
  summarizeWorkload,
} from "../../../src/patterns/work-queue/types.js";
import type {
  WorkItem,
  WorkQueueTransport,
} from "../../../src/patterns/work-queue/types.js";

const NOW = new Date("2026-08-13T12:00:00.000Z");

const items: WorkItem[] = [
  {
    id: "w1",
    title: "Review MSA_Acme_v4",
    type: "review",
    status: "open",
    dueAt: "2026-08-12T09:00:00.000Z",
    assignee: { id: "morgan", name: "Morgan Lee" },
    riskLevel: "high",
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

const createController = (transport: WorkQueueTransport): WorkQueueController =>
  new WorkQueueController({ token: "token", transport });

describe("resolveDueBucket", () => {
  it("buckets relative to the supplied reference time", () => {
    expect(resolveDueBucket("2026-08-12T09:00:00.000Z", NOW)).toBe("overdue");
    expect(resolveDueBucket("2026-08-13T20:00:00.000Z", NOW)).toBe("today");
    expect(resolveDueBucket("2026-08-17T09:00:00.000Z", NOW)).toBe("this-week");
    expect(resolveDueBucket("2026-09-13T09:00:00.000Z", NOW)).toBe("later");
    expect(resolveDueBucket(undefined, NOW)).toBe("none");
    expect(resolveDueBucket("not a date", NOW)).toBe("none");
  });
});

describe("summarizeWorkload", () => {
  it("builds per-assignee lanes with roster order, spare capacity, and an unassigned lane", () => {
    const team = [
      { id: "morgan", name: "Morgan Lee" },
      { id: "sam", name: "Sam Rivera" },
    ];
    const lanes = summarizeWorkload(items, team, NOW);

    expect(lanes.map(lane => lane.assignee?.name ?? "unassigned")).toEqual([
      "Morgan Lee",
      "Sam Rivera",
      "Avery Chen",
      "unassigned",
    ]);
    expect(lanes[0]).toMatchObject({ total: 1, overdue: 1 });
    // Roster member with no items still gets a visible lane.
    expect(lanes[1]).toMatchObject({ total: 0, overdue: 0 });
    expect(lanes[2]).toMatchObject({ total: 1, inProgress: 1 });
    expect(lanes[3]?.items.map(item => item.id)).toEqual(["w3"]);
  });

  it("omits the unassigned lane when everything is assigned", () => {
    const assigned = items.filter(item => item.assignee);
    const lanes = summarizeWorkload(assigned, [], NOW);
    expect(lanes.every(lane => lane.assignee !== null)).toBe(true);
  });
});

describe("WorkQueueController", () => {
  it("loads on connect and exposes items", async () => {
    const transport = createTransport();
    const controller = createController(transport);
    const changed = vi.fn();
    controller.subscribe("itemsChanged", changed);

    await controller.connect();

    expect(controller.getState().items).toHaveLength(3);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(transport.loadItems).toHaveBeenCalledWith(
      expect.objectContaining({ token: "token", filters: {} }),
    );
  });

  it("merges filters (undefined clears) and reloads with them", async () => {
    const transport = createTransport();
    const controller = createController(transport);
    await controller.connect();

    await controller.setFilters({ status: "open", riskLevel: "high" });
    await controller.setFilters({ riskLevel: undefined });

    expect(controller.getState().filters).toEqual({ status: "open" });
    expect(transport.loadItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { status: "open" } }),
    );
    expect(transport.loadItems).toHaveBeenCalledTimes(3);
  });

  it("discards a superseded load so a stale response cannot overwrite a newer one", async () => {
    type LoadResult = { items: WorkItem[] };
    const deferred = (): { promise: Promise<LoadResult>; resolve: (value: LoadResult) => void } => {
      let resolve!: (value: LoadResult) => void;
      const promise = new Promise<LoadResult>(res => {
        resolve = res;
      });
      return { promise, resolve };
    };
    const stale = deferred();
    const fresh = deferred();
    const loadItems = vi
      .fn()
      .mockResolvedValueOnce({ items })
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(fresh.promise);
    const controller = createController(createTransport({ loadItems }));
    await controller.connect();

    const first = controller.reload();
    const second = controller.reload();
    fresh.resolve({ items: [items[1]!] });
    // The superseded response lands last — it must not win.
    stale.resolve({ items: [items[0]!] });
    await Promise.all([first, second]);

    expect(controller.getState().items.map(item => item.id)).toEqual(["w2"]);
    expect(controller.getState().loading).toBe(false);
  });

  it("reports load failures", async () => {
    const transport = createTransport({
      loadItems: vi.fn().mockRejectedValue(new Error("queue backend down")),
    });
    const controller = createController(transport);
    const failed = vi.fn();
    controller.subscribe("loadFailed", failed);

    await controller.connect();

    expect(controller.getState().error).toBe("queue backend down");
    expect(controller.getState().loading).toBe(false);
    expect(failed).toHaveBeenCalledWith({ message: "queue backend down" });
  });

  it("runs mutations through the transport and reloads on success", async () => {
    const completeItem = vi.fn().mockResolvedValue({ ...items[0], status: "completed" });
    const transport = createTransport({ completeItem });
    const controller = createController(transport);
    const mutated = vi.fn();
    controller.subscribe("itemMutated", mutated);
    await controller.connect();

    const result = await controller.completeItem("w1");

    expect(result?.status).toBe("completed");
    expect(completeItem).toHaveBeenCalledWith({ itemId: "w1", token: "token" });
    expect(mutated).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "complete" }),
    );
    expect(transport.loadItems).toHaveBeenCalledTimes(2);
  });

  it("claims and reassigns with an assignee id", async () => {
    const claimItem = vi.fn().mockResolvedValue(items[2]);
    const reassignItem = vi.fn().mockResolvedValue(items[0]);
    const controller = createController(createTransport({ claimItem, reassignItem }));
    await controller.connect();

    await controller.claimItem("w3", "morgan");
    await controller.reassignItem("w1", "avery");

    expect(claimItem).toHaveBeenCalledWith({ itemId: "w3", assigneeId: "morgan", token: "token" });
    expect(reassignItem).toHaveBeenCalledWith({ itemId: "w1", assigneeId: "avery", token: "token" });
  });

  it("emits mutationFailed and keeps items on error", async () => {
    const escalateItem = vi.fn().mockRejectedValue(new Error("policy refused"));
    const controller = createController(createTransport({ escalateItem }));
    const failed = vi.fn();
    controller.subscribe("mutationFailed", failed);
    await controller.connect();

    const result = await controller.escalateItem("w1", "SLA breach");

    expect(result).toBeNull();
    expect(failed).toHaveBeenCalledWith({
      kind: "escalate",
      itemId: "w1",
      message: "policy refused",
    });
    expect(controller.getState().items).toHaveLength(3);
  });

  it("keeps the receiver so a class-based transport can read `this`", async () => {
    class ClassTransport implements WorkQueueTransport {
      readonly calls: string[] = [];

      async loadItems() {
        await Promise.resolve();
        return { items };
      }

      async claimItem({ itemId }: { itemId: string }) {
        // Each capability reads `this`: a detached call would throw here.
        this.calls.push(`claim:${itemId}`);
        await Promise.resolve();
        return items[2]!;
      }

      async reassignItem({ itemId }: { itemId: string }) {
        this.calls.push(`reassign:${itemId}`);
        await Promise.resolve();
        return items[0]!;
      }

      async completeItem({ itemId }: { itemId: string }) {
        this.calls.push(`complete:${itemId}`);
        await Promise.resolve();
        return items[0]!;
      }

      async escalateItem({ itemId }: { itemId: string }) {
        this.calls.push(`escalate:${itemId}`);
        await Promise.resolve();
        return items[0]!;
      }
    }

    const transport = new ClassTransport();
    const controller = createController(transport);
    await controller.connect();

    await controller.claimItem("w3", "morgan");
    await controller.reassignItem("w1", "avery");
    await controller.completeItem("w1");
    await controller.escalateItem("w1", "SLA breach");

    expect(transport.calls).toEqual([
      "claim:w3",
      "reassign:w1",
      "complete:w1",
      "escalate:w1",
    ]);
  });

  it("refuses mutations without the transport capability", async () => {
    const controller = createController(createTransport());
    await controller.connect();

    await expect(controller.completeItem("w1")).rejects.toThrow("does not support complete");
  });

  it("ignores mutations for unknown items", async () => {
    const completeItem = vi.fn();
    const controller = createController(createTransport({ completeItem }));
    await controller.connect();

    expect(await controller.completeItem("nope")).toBeNull();
    expect(completeItem).not.toHaveBeenCalled();
  });

  it("disconnect resets the session", async () => {
    const controller = createController(createTransport());
    await controller.connect();

    controller.disconnect();

    expect(controller.getState()).toMatchObject({ connected: false, items: [], error: null });
  });
});
