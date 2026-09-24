import { ResultBlocks, type ResultBlock } from "./result-blocks.js";
const DEFAULT_TAG_NAME = "box-check-list";
export class CheckList extends ResultBlocks {
  static readonly tagName = DEFAULT_TAG_NAME;
  get rows(): Extract<ResultBlock, {type: "checks"}>["rows"] { const b = this.blocks[0]; return b?.type === "checks" ? b.rows : []; }
  set rows(rows: Extract<ResultBlock, {type: "checks"}>["rows"]) { this.blocks = [{type: "checks", rows}]; }
}
CheckList.register();
