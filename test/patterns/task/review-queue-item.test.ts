// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxReviewQueueItemElement,
  defineBoxReviewQueueItemElement,
} from "../../../src/patterns/task/review-queue-item.js";

describe("BoxReviewQueueItemElement", () => {
  beforeEach(() => {
    defineBoxReviewQueueItemElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders task summary, assignee, and metrics", () => {
    const element = document.createElement("box-review-queue-item") as BoxReviewQueueItemElement;
    element.heading = "Launch Checklist";
    element.itemLabel = "Brand Strategy.pdf";
    element.assignee = { name: "Morgan Lee", role: "Owner" };
    element.metrics = [
      { label: "Comments", value: "12" },
      { label: "Pages", value: "18" },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Launch Checklist");
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("Launch Checklist");
    expect(element.shadowRoot?.textContent).toContain("Brand Strategy.pdf");
    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Comments");
  });

  it("emits selected when the row is opened", () => {
    const element = document.createElement("box-review-queue-item") as BoxReviewQueueItemElement;
    const selected = vi.fn();
    element.heading = "Launch Checklist";
    element.itemLabel = "Brand Strategy.pdf";
    element.addEventListener("selected", selected);

    document.body.append(element);

    const trigger = element.shadowRoot?.querySelector('[part="select"]') as HTMLButtonElement | null;
    trigger?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          title: "Launch Checklist",
          itemLabel: "Brand Strategy.pdf",
        },
      }),
    );
  });

  it("emits action for task controls", () => {
    const element = document.createElement("box-review-queue-item") as BoxReviewQueueItemElement;
    const action = vi.fn();
    element.heading = "Launch Checklist";
    element.itemLabel = "Brand Strategy.pdf";
    element.actions = [
      { id: "open", label: "Open", tone: "primary" },
    ];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="open"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          action: "open",
          title: "Launch Checklist",
          itemLabel: "Brand Strategy.pdf",
        },
      }),
    );
  });
});
