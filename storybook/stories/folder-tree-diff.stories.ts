import type { StoryModule } from "../metadata.js";
import type { FolderTreeDiff } from "../../src/patterns/folder-tree/folder-tree-diff.js";
const story:StoryModule = {
  title:"Patterns/Content Explorer/Folder Tree Diff",
  meta:{id:"folder-tree-diff",tag:"box-folder-tree-diff",shortDescription:"Compare host-provided file and folder structures.",docsDescription:"Unified or aligned before/after rows, difference navigation and explicit partial coverage, without file contents. See docs/patterns/folder-tree.md.",sourceSnippet:`<box-folder-tree-diff left-label="Source" right-label="Destination"></box-folder-tree-diff>`,referenceRows:[
    {kind:"property",name:"nodes",type:"FolderTreeDiffNode[]",description:"Precomputed structural comparison; host owns matching and move detection."},
    ...["mode","leftLabel","rightLabel","changesOnly","expandedIds","selectedIds","activeId","filter","partial"].map(name=>({kind:"property" as const,name,description:"Host-controlled comparison state; see folder tree guide."})),
    ...["expanded-changed","selected-changed","active-changed","load-children","item-activated","difference-navigated","changes-only-changed"].map(name=>({kind:"event" as const,name,description:"Composed host intent with comparison state."})),
  ]},
  variants:(["unified","side-by-side"] as const).map(mode=>({name:mode,html:`<box-folder-tree-diff mode="${mode}" partial></box-folder-tree-diff>`,setup:root=>{const tree=root.querySelector<FolderTreeDiff>("box-folder-tree-diff")!;tree.nodes=[{id:"r",name:"Projects",path:"/Projects",type:"folder",status:"equal",loadState:"partial"},...(["added","removed","changed","moved","equal"] as const).map(status=>({id:status,parentId:"r",name:`${status}.pdf`,path:`/Projects/${status}.pdf`,type:"file" as const,status,before:{path:`/Old/${status}.pdf`},after:{path:`/Projects/${status}.pdf`}}))];}})),
};
export default story;
