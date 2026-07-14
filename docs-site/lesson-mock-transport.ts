/**
 * The folder-correct mock transport used by the Explorer build-along's live
 * previews. It mirrors the transport the lesson's Step 2 shows, so the live
 * preview renders exactly what the copied starter produces. Pure and DOM-free
 * so it can be unit-tested in node and cannot drift from the taught behavior.
 */

type ItemType = "folder" | "file" | "web_link";
interface FolderItem {
  id: string;
  name: string;
  type: ItemType;
}
interface FolderResponse {
  folderId: string;
  folder: FolderItem;
  breadcrumbs: FolderItem[];
  items: FolderItem[];
  pagination: { hasMoreItems: boolean; limit: number; offset: number; totalCount: number };
}

const FOLDER_NAMES: Record<string, string> = { "0": "All Files", "42": "Marketing", "77": "Legal" };

export const lessonMockTransport = () => ({
  async loadFolderItems({ folderId }: { folderId: string }): Promise<FolderResponse> {
    const atRoot = folderId === "0";
    const name = FOLDER_NAMES[folderId] || "Folder";
    return {
      folderId,
      folder: { id: folderId, name, type: "folder" },
      breadcrumbs: atRoot
        ? [{ id: "0", name: "All Files", type: "folder" }]
        : [
            { id: "0", name: "All Files", type: "folder" },
            { id: folderId, name, type: "folder" },
          ],
      items: atRoot
        ? [
            { id: "42", name: "Marketing", type: "folder" },
            { id: "77", name: "Legal", type: "folder" },
            { id: "123", name: "Quarterly Plan.pdf", type: "file" },
            { id: "124", name: "Brand Guidelines.pdf", type: "file" },
            { id: "125", name: "box.com/launch", type: "web_link" },
          ]
        : [
            { id: `${folderId}-plan`, name: `${name} plan.docx`, type: "file" },
            { id: `${folderId}-brief`, name: `${name} brief.pdf`, type: "file" },
          ],
      pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: atRoot ? 5 : 2 },
    };
  },
});
