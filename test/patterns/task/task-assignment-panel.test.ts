// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxTaskAssignmentPanelElement,
  defineBoxTaskAssignmentPanelElement,
} from "../../../src/patterns/task/task-assignment-panel.js";

describe("BoxTaskAssignmentPanelElement", () => {
  beforeEach(() => {
    defineBoxTaskAssignmentPanelElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders assignees and checklist items", () => {
    const element = document.createElement("box-task-assignment-panel") as BoxTaskAssignmentPanelElement;
    element.heading = "Review Task";
    element.assignees = [
      { id: "morgan", name: "Morgan Lee", description: "Content Designer" },
    ];
    element.checklist = [
      { id: "annotate", label: "Resolve annotations", description: "Confirm every comment is addressed." },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Review Task");
    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Resolve annotations");
  });

  it("emits assignee-changed and checklist-changed", () => {
    const element = document.createElement("box-task-assignment-panel") as BoxTaskAssignmentPanelElement;
    const assigneeChanged = vi.fn();
    const checklistChanged = vi.fn();
    element.assignees = [
      { id: "avery", name: "Avery Chen" },
    ];
    element.checklist = [
      { id: "review", label: "Review latest draft", checked: false },
    ];
    element.addEventListener("assignee-changed", assigneeChanged);
    element.addEventListener("checklist-changed", checklistChanged);

    document.body.append(element);

    const assigneeButton = element.shadowRoot?.querySelector('[data-assignee-id="avery"]') as HTMLButtonElement | null;
    assigneeButton?.click();
    const checkbox = element.shadowRoot?.querySelector('[data-item-id="review"]') as HTMLInputElement | null;
    checkbox?.click();

    expect(element.currentAssigneeId).toBe("avery");
    expect(assigneeChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { assigneeId: "avery" },
      }),
    );
    expect(checklistChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          itemId: "review",
          checked: true,
        }),
      }),
    );
  });

  it("emits action with current assignment state", () => {
    const element = document.createElement("box-task-assignment-panel") as BoxTaskAssignmentPanelElement;
    const action = vi.fn();
    element.currentAssigneeId = "morgan";
    element.checklist = [
      { id: "signoff", label: "Collect sign-off", checked: true },
    ];
    element.actions = [
      { id: "complete", label: "Complete task", tone: "primary" },
    ];
    element.addEventListener("action", action);

    document.body.append(element);

    const actionButton = element.shadowRoot?.querySelector('[data-action-id="complete"]') as HTMLButtonElement | null;
    actionButton?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          action: "complete",
          assigneeId: "morgan",
          checklist: [{ id: "signoff", label: "Collect sign-off", checked: true }],
        },
      }),
    );
  });
});
