import type { StoryModule } from "../metadata.js";
import { statusDemoHtml } from "../fixtures/status.js";
import {callConsoleDemoHtml,callConsoleSetupCode,setupCallConsoleDemo} from "../fixtures/call-console.js";
import {workspaceDemoHtml,workspaceSetupCode,workspaceDemoModes,setupWorkspaceDemo} from "../fixtures/agent-workspace.js";
const definitions = [
  ["status-icon","Components/Feedback/Status Icon","Shared status glyph with a text alternative.","kind","StatusKind"],
  ["fact-list","Components/Collections/Fact List","Label/value facts separated by hairlines.","rows","{label, value}[]"],
  ["check-list","Components/Collections/Check List","Policy checks with glyphs, verdict words and reasons.","rows","{label, status, value?, detail?}[]"],
  ["document-list","Components/Collections/Document List","Whole-row safe document links with exposed IDs.","items","{id, name, detail?, href?}[]"],
  ["result-blocks","Components/Collections/Result Blocks","Semantic streamed facts, checks, tables and documents.","blocks","ResultBlock[]"],
  ["run-summary","Patterns/Runs/Run Summary","Collapsed plan and trace with live progress and elapsed time.","turn","RunTurn"],
] as const;
export const agentUiStories: StoryModule[] = definitions.map(([id,title,description,property,type])=>({
  title,
  meta:{id,tag:`box-${id}`,shortDescription:description,docsDescription:`${description} See the Agent UI building blocks guide for contracts, lifecycle and examples.`,sourceSnippet:`<box-${id}></box-${id}>`,referenceRows:[{kind:property === "kind" ? "attribute" : "property",name:property,type,description}]},
  variants:[{name:"Default",html:id === "status-icon" ? statusDemoHtml : `<box-${id}></box-${id}>`}],
}));
agentUiStories.push({
  title:"Patterns/Agent Chat/Agent Workspace",
  meta:{id:"agent-workspace",tag:"box-agent-workspace",shortDescription:"Independent conversations with responsive chats and details panes.",
    docsDescription:"The host owns AgentWorkspaceController and destroys it on teardown. Hidden conversations stay connected. Below 900px, chats and details become exclusive drawers; at 1200px details defaults open. Expand the simulated preview for the three-pane layout. Approval demonstrates a failed execution, not a successful write.",
    sourceSnippet:`<box-agent-workspace style="height:600px"></box-agent-workspace>\n<script type="module">\n${workspaceSetupCode}\n</script>`,
    referenceRows:[
      {kind:"property",name:"workspaceController",type:"AgentWorkspaceController | null",description:"Owns independent sessions. Assign after mounting and destroy on host teardown."},
      {kind:"attribute",name:"viewer-key",type:"string",description:"Scopes saved desktop pane preferences per viewer."},
      {kind:"slot",name:"chats",description:"Optional replacement conversation list."},
      {kind:"slot",name:"conversation",description:"Optional replacement conversation area."},
      {kind:"slot",name:"details",description:"Optional replacement context, approval and source details."},
      {kind:"part",name:"workspace",description:"Outer workspace layout."},
      {kind:"part",name:"chat",description:"Conversation selection buttons."},
    ]},
  variants:workspaceDemoModes.map(mode=>({name:mode[0].toUpperCase()+mode.slice(1),html:workspaceDemoHtml,setup:root=>setupWorkspaceDemo(root,mode)})),
});
agentUiStories.push({
  title:"Patterns/Developer Tools/Call Console",
  meta:{id:"call-console",tag:"box-call-console",shortDescription:"A developer-only request log with a searchable list and request/response inspector.",
    docsDescription:"Bind a CallConsoleController to callController, then connect it. Search and service/error filters narrow the list; tool failures remain failures even on HTTP 200. Copy each HTTP section or both. The host owns connection teardown and must authorize the /calls endpoints. The docs use simulated data, never live credentials.",
    sourceSnippet:`<box-call-console></box-call-console>\n<script type="module">\n${callConsoleSetupCode}\n</script>`,
    referenceRows:[
      {kind:"property",name:"callController",type:"CallConsoleController | null",description:"Controller for redacted call entries and connection state. Call connect() to load/subscribe and destroy() on host teardown."},
      {kind:"event",name:"call-selected",type:"{ id: string }",description:"A request was selected. Payload intentionally excludes request bodies and headers."},
      {kind:"event",name:"filters-changed",type:"{ service: string; errorsOnly: boolean; query: string }",description:"User changed the search, service or error filter."},
      {kind:"event",name:"calls-cleared",type:"void",description:"The server clear request completed successfully."},
      {kind:"event",name:"code-copied",type:"{ copied: boolean }",description:"A section copy was attempted by the shared code block."},
      {kind:"part",name:"console",description:"Outer console surface."},
      {kind:"part",name:"call",description:"Request selection buttons."},
    ]},
  variants:(["live","empty","connecting","reconnecting","unavailable"] as const).map(mode=>({name:mode === "live" ? "Populated" : mode[0].toUpperCase()+mode.slice(1),html:callConsoleDemoHtml,setup:root=>setupCallConsoleDemo(root,mode),note:"Simulated traffic only. Use Simulate request and Reset demo to exercise updates."})),
});
