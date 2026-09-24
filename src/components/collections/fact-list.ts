import { ResultBlocks, type ResultBlock } from "./result-blocks.js";
const DEFAULT_TAG_NAME = "box-fact-list";
export class FactList extends ResultBlocks {
  static readonly tagName = DEFAULT_TAG_NAME;
  get rows(): Extract<ResultBlock, {type: "facts"}>["rows"] { const b = this.blocks[0]; return b?.type === "facts" ? b.rows : []; }
  set rows(rows: Extract<ResultBlock, {type: "facts"}>["rows"]) { this.blocks = [{type: "facts", rows}]; }
}
FactList.register();
