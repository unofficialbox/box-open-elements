import type { StoryModule } from "../metadata.js";
import type { FolderTree } from "../../src/patterns/folder-tree/folder-tree.js";
const story:StoryModule = {
  title:"Patterns/Content Explorer/Folder Tree",
  meta:{ id:"folder-tree", tag:"box-folder-tree", shortDescription:"A read-only hierarchical file and folder view.", docsDescription:"Provider-neutral IDs, host-driven lazy loading, controlled state and accessible keyboard navigation. See docs/patterns/folder-tree.md.", sourceSnippet:`<box-folder-tree label="Projects"></box-folder-tree>`, referenceRows:[
    {kind:"property",name:"nodes",type:"FolderTreeNode[]",description:"Host snapshot of unique IDs and parent links."},
    ...["expandedIds","selectedIds","activeId","filter","loading","partial","unavailable","selectionDisabled"].map(name=>({kind:"property" as const,name,description:"Authoritative host state; see the folder tree guide."})),
    ...["expanded-changed","selected-changed","active-changed","load-children","item-activated"].map(name=>({kind:"event" as const,name,description:"Composed host intent with stable id and node."})),
    ...["status-${id}","metadata-${id}","actions-${id}"].map(name=>({kind:"slot" as const,name,description:"Optional host row content."})),
  ]},
  variants:[{name:"Mixed hierarchy",html:`<box-folder-tree label="Projects"></box-folder-tree>`,setup:root=>{const tree=root.querySelector<FolderTree>("box-folder-tree")!;tree.nodes=[{id:"r",name:"Projects",type:"folder"},{id:"f",parentId:"r",name:"Plan.pdf",type:"file"}];tree.expandedIds=["r"]; }},
  ...(["loading","unavailable","partial"] as const).map(state=>({name:state,html:`<box-folder-tree label="Projects" ${state}></box-folder-tree>`}))],
};
export default story;
