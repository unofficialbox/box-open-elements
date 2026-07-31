import { ExplorerList } from "./list.js";

const DEFAULT_TAG_NAME = "box-explorer-items";

export class ExplorerItems extends ExplorerList {
  static readonly tagName: string = DEFAULT_TAG_NAME;}

ExplorerItems.register();
