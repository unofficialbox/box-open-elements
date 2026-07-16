import type { StoryModule } from "../metadata.js";

const taskAssignmentPanel: StoryModule = {
  title: "Patterns/Task/Task Assignment Panel",
  meta: {
    id: "task-assignment-panel",
    tag: "box-task-assignment-panel",
    shortDescription: "A task assignment panel with assignees and checklist state.",
    docsDescription: "Use JSON `assignees`, `checklist`, and `actions`; set task metadata with string attributes.",
    sourceSnippet: `<box-task-assignment-panel heading="Contract review" status="In progress" priority="High" due-date="Jul 18, 2026"></box-task-assignment-panel>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Task heading." },
      { kind: "attribute", name: "message", type: "string", description: "Task summary." },
      { kind: "attribute", name: "status", type: "string", description: "Task status label." },
      { kind: "attribute", name: "priority", type: "string", description: "Priority label." },
      { kind: "attribute", name: "due-date", type: "string", description: "Due date label." },
      { kind: "attribute", name: "current-assignee-id", type: "string", description: "Selected assignee id." },
      { kind: "attribute", name: "assignees", type: "json", description: "Assignable people." },
      { kind: "attribute", name: "checklist", type: "json", description: "Checklist items." },
      { kind: "attribute", name: "actions", type: "json", description: "Task action buttons." },
      { kind: "event", name: "assignee-changed", description: "Emitted when the assignee selection changes." },
      { kind: "event", name: "checklist-changed", description: "Emitted when checklist state changes." },
      { kind: "event", name: "action", description: "Emitted with current assignment state." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-task-assignment-panel heading="Contract review" status="In progress" priority="High" due-date="Jul 18, 2026" message="Legal review before countersign." current-assignee-id="morgan" assignees='[{"id":"morgan","name":"Morgan Lee","description":"Legal","status":"Active"},{"id":"alex","name":"Alex Kim","description":"Procurement"}]' checklist='[{"id":"terms","label":"Review terms","checked":true},{"id":"redlines","label":"Resolve redlines"}]' actions='[{"id":"approve","label":"Approve","tone":"primary"},{"id":"reassign","label":"Reassign"}]'></box-task-assignment-panel>`,
    },
  ],
};

export default taskAssignmentPanel;
