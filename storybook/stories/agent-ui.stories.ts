import type { StoryModule } from "../metadata.js";
const definitions = [
  ["status-icon","Components/Feedback/Status Icon","Shared status glyph with a text alternative.","kind","StatusKind"],
  ["fact-list","Components/Collections/Fact List","Label/value facts separated by hairlines.","rows","{label, value}[]"],
  ["check-list","Components/Collections/Check List","Policy checks with glyphs, verdict words and reasons.","rows","{label, status, value?, detail?}[]"],
  ["document-list","Components/Collections/Document List","Whole-row safe document links with exposed IDs.","items","{id, name, detail?, href?}[]"],
  ["result-blocks","Components/Collections/Result Blocks","Semantic streamed facts, checks, tables and documents.","blocks","ResultBlock[]"],
  ["run-summary","Patterns/Runs/Run Summary","Collapsed plan and trace with live progress and elapsed time.","turn","RunTurn"],
  ["agent-workspace","Patterns/Agent Chat/Agent Workspace","Persistent conversations with responsive side panes.","workspaceController","AgentWorkspaceController"],
  ["call-console","Patterns/Developer Tools/Call Console","Separate developer call log with HTTP and tool errors.","callController","CallConsoleController"],
] as const;
export const agentUiStories: StoryModule[] = definitions.map(([id,title,description,property,type])=>({
  title,
  meta:{id,tag:`box-${id}`,shortDescription:description,docsDescription:`${description} See the Agent UI building blocks guide for contracts, lifecycle and examples.`,sourceSnippet:`<box-${id}></box-${id}>`,referenceRows:[{kind:property === "kind" ? "attribute" : "property",name:property,type,description}]},
  variants:[{name:"Default",html:`<box-${id}></box-${id}>`}],
}));
