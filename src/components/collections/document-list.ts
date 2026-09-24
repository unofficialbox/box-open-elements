import { ResultBlocks, type ResultBlock } from "./result-blocks.js";
const DEFAULT_TAG_NAME = "box-document-list";
export class DocumentList extends ResultBlocks {
  static readonly tagName = DEFAULT_TAG_NAME;
  get items(): Extract<ResultBlock, {type: "documents"}>["items"] { const b = this.blocks[0]; return b?.type === "documents" ? b.items : []; }
  set items(items: Extract<ResultBlock, {type: "documents"}>["items"]) { this.blocks = [{type: "documents", items}]; }
}
DocumentList.register();
