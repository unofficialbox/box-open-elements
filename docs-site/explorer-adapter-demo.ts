/**
 * Shared ContentExplorerController wiring for docs-site / workshop adapter demos.
 * Relative imports keep Vitest off the package barrel (coverage floors).
 */
import { ContentExplorerController } from "../src/patterns/content-explorer/controller.js";
import type {
  ExplorerItem,
  ExplorerTransport,
} from "../src/patterns/content-explorer/types.js";

const mockOwner = { id: "u1", name: "Morgan Lee", type: "user" as const };

export const explorerDemoItems: ExplorerItem[] = [
  {
    id: "42",
    name: "Marketing",
    type: "folder",
    modifiedAt: "2026-06-12T15:00:00.000Z",
    owner: mockOwner,
  },
  {
    id: "77",
    name: "Legal",
    type: "folder",
    modifiedAt: "2026-05-01T12:00:00.000Z",
    owner: mockOwner,
  },
  {
    id: "123",
    name: "Quarterly Plan.pdf",
    type: "file",
    size: 2_400_000,
    modifiedAt: "2026-07-10T18:30:00.000Z",
    extension: "pdf",
    owner: mockOwner,
    sharedLink: { isShared: true, access: "company" },
    preview: { canPreview: true, extension: "pdf" },
  },
  {
    id: "124",
    name: "Brand Guidelines.pdf",
    type: "file",
    size: 5_120_000,
    modifiedAt: "2026-07-01T09:15:00.000Z",
    extension: "pdf",
    owner: mockOwner,
    sharedLink: { isShared: false },
    preview: { canPreview: true, extension: "pdf" },
  },
  {
    id: "125",
    name: "box.com/launch",
    type: "web_link",
    modifiedAt: "2026-04-20T11:00:00.000Z",
    owner: mockOwner,
  },
];

export const createExplorerDemoTransport = (
  items: ExplorerItem[] = explorerDemoItems,
): ExplorerTransport => ({
  async loadFolderItems({ folderId }) {
    const root = folderId === "0";
    return {
      folderId,
      folder: { id: folderId, name: root ? "All Files" : "Marketing", type: "folder" },
      breadcrumbs: root
        ? [{ id: "0", name: "All Files", type: "folder" }]
        : [
            { id: "0", name: "All Files", type: "folder" },
            { id: "42", name: "Marketing", type: "folder" },
          ],
      items: items.map(item => ({
        ...item,
        parent: root ? { id: "0", name: "All Files" } : { id: "42", name: "Marketing" },
      })),
      pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: items.length },
    };
  },
  async searchItems({ query, ancestorFolderId, limit = 25, offset = 0 }) {
    const normalized = query.trim().toLowerCase();
    const matches = items
      .filter(item => item.name.toLowerCase().includes(normalized))
      .map(item => ({
        ...item,
        parent: {
          id: ancestorFolderId ?? "0",
          name: ancestorFolderId === "42" ? "Marketing" : "All Files",
        },
      }));
    const page = matches.slice(offset, offset + limit);
    return {
      query,
      ancestorFolderId,
      items: page,
      pagination: {
        hasMoreItems: offset + page.length < matches.length,
        limit,
        offset,
        totalCount: matches.length,
        nextOffset: offset + page.length,
      },
    };
  },
});

export const createExplorerDemoController = (
  transport: ExplorerTransport = createExplorerDemoTransport(),
): ContentExplorerController =>
  new ContentExplorerController({
    rootFolderId: "0",
    token: "docs-token",
    transport,
    itemActions: [
      { id: "share", label: "Share" },
      { id: "download", label: "Download", itemTypes: ["file"] },
    ],
  });

/** Bind a controller to one adapter element and connect. */
export const setupExplorerAdapter = (
  root: HTMLElement,
  selector: string,
  options: { selectItemId?: string; itemId?: string } = {},
): (() => void) => {
  const controller = createExplorerDemoController();
  const element = root.querySelector(selector) as
    | (HTMLElement & { controller?: ContentExplorerController; itemId?: string })
    | null;
  if (!element) {
    return () => {};
  }
  element.controller = controller;
  if (options.itemId) {
    element.itemId = options.itemId;
  }
  void controller.connect().then(() => {
    if (options.selectItemId) {
      controller.toggleSelection(options.selectItemId);
    }
  });
  return () => {
    void controller.disconnect();
  };
};
