// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxUnifiedShareModalElement,
  defineBoxUnifiedShareModalElement,
} from "../../../src/patterns/share/unified-share-modal.js";
import type { ShareDataSource, ShareState } from "../../../src/patterns/share/contracts.js";

const baseState = (): ShareState => ({
  itemId: "42",
  itemType: "file",
  sharedLink: { url: "https://app.box.com/s/abc", access: "company" },
  collaborators: [
    { id: "1", name: "Morgan Lee", type: "user", role: "co-owner", status: "active" },
    { id: "2", name: "Finance Team", type: "group", role: "viewer" },
  ],
});

const createDataSource = (overrides: Partial<ShareDataSource> = {}): ShareDataSource => {
  let state = baseState();
  return {
    getShareState: vi.fn(async () => state),
    updateSharedLink: vi.fn(async ({ sharedLink }) => {
      state = { ...state, sharedLink };
      return state;
    }),
    listCollaborators: vi.fn(async () => state.collaborators),
    ...overrides,
  };
};

const openModal = async (
  dataSource: ShareDataSource = createDataSource(),
): Promise<BoxUnifiedShareModalElement> => {
  const element = document.createElement("box-unified-share-modal") as BoxUnifiedShareModalElement;
  element.dataSource = dataSource;
  element.itemId = "42";
  element.open = true;
  document.body.append(element);
  await vi.waitFor(() =>
    expect(element.shadowRoot?.querySelector('[part="link-url"]')).not.toBeNull(),
  );
  return element;
};

describe("BoxUnifiedShareModalElement", () => {
  beforeEach(() => {
    defineBoxUnifiedShareModalElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders a modal dialog when open and nothing when closed", async () => {
    const element = await openModal();

    const dialog = element.shadowRoot?.querySelector('[part="dialog"]');
    expect(dialog?.getAttribute("role")).toBe("dialog");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");

    element.open = false;
    expect(element.shadowRoot?.querySelector('[part="dialog"]')).toBeNull();
  });

  it("loads and shows the shared link on the link tab", async () => {
    const element = await openModal();

    const url = element.shadowRoot?.querySelector('[part="link-url"]') as HTMLInputElement;
    expect(url.value).toBe("https://app.box.com/s/abc");
    const access = element.shadowRoot?.querySelector('[part="access"]') as HTMLSelectElement;
    expect(access.value).toBe("company");
  });

  it("copies the link and emits linkcopied", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    const element = await openModal();
    const onCopied = vi.fn();
    element.addEventListener("linkcopied", onCopied);

    (element.shadowRoot?.querySelector('[part="copy"]') as HTMLButtonElement).click();

    await vi.waitFor(() => expect(onCopied).toHaveBeenCalled());
    expect(writeText).toHaveBeenCalledWith("https://app.box.com/s/abc");
    expect(onCopied).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { url: "https://app.box.com/s/abc" } }),
    );
  });

  it("changes access through the data source", async () => {
    const dataSource = createDataSource();
    const element = await openModal(dataSource);

    const access = element.shadowRoot?.querySelector('[part="access"]') as HTMLSelectElement;
    access.value = "open";
    access.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() =>
      expect(dataSource.updateSharedLink).toHaveBeenCalledWith(
        expect.objectContaining({ sharedLink: expect.objectContaining({ access: "open" }) }),
      ),
    );
  });

  it("switches to the people tab and lists collaborators", async () => {
    const element = await openModal();

    (element.shadowRoot?.querySelector('[part="tab-people"]') as HTMLButtonElement).click();

    const roster = element.shadowRoot?.querySelectorAll('[part="collaborator"]');
    expect(roster?.length).toBe(2);
    expect(element.shadowRoot?.querySelector('[part="collaborator-name"]')?.textContent).toContain("Morgan Lee");
  });

  it("switches tabs via arrow keys and moves focus", async () => {
    const element = await openModal();
    const tablist = element.shadowRoot?.querySelector('[part="tablist"]') as HTMLElement;

    tablist.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(element.shadowRoot?.querySelector('[part="tab-people"]')?.getAttribute("aria-selected")).toBe("true");
    expect(element.shadowRoot?.querySelector('[part="collaborator"]')).not.toBeNull();

    tablist.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(element.shadowRoot?.querySelector('[part="tab-link"]')?.getAttribute("aria-selected")).toBe("true");
  });

  it("closes on Escape", async () => {
    const element = await openModal();
    const onClose = vi.fn();
    element.addEventListener("close", onClose);

    element.shadowRoot
      ?.querySelector('[part="dialog"]')
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(element.open).toBe(false);
  });

  it("does not emit linkcopied when the clipboard write fails", async () => {
    const writeText = vi.fn(async () => {
      throw new Error("denied");
    });
    Object.assign(navigator, { clipboard: { writeText } });
    const element = await openModal();
    const onCopied = vi.fn();
    element.addEventListener("linkcopied", onCopied);

    (element.shadowRoot?.querySelector('[part="copy"]') as HTMLButtonElement).click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(onCopied).not.toHaveBeenCalled();
  });

  it("does not emit linkcopied when navigator.clipboard is unavailable", async () => {
    const original = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    try {
      const element = await openModal();
      const onCopied = vi.fn();
      element.addEventListener("linkcopied", onCopied);

      (element.shadowRoot?.querySelector('[part="copy"]') as HTMLButtonElement).click();
      await Promise.resolve();

      expect(onCopied).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(navigator, "clipboard", { value: original, configurable: true });
    }
  });

  it("keeps focus on the access select while it updates", async () => {
    const element = await openModal();
    const access = element.shadowRoot?.querySelector('[part="access"]') as HTMLSelectElement;
    access.focus();
    access.value = "open";
    access.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() =>
      expect((element.shadowRoot?.querySelector('[part="access"]') as HTMLSelectElement).value).toBe("open"),
    );
    // The same node survived (not rebuilt), so focus is retained inside the dialog.
    expect(element.shadowRoot?.activeElement).toBe(element.shadowRoot?.querySelector('[part="access"]'));
  });

  it("emits invite when the invite affordance is used", async () => {
    const element = await openModal();
    (element.shadowRoot?.querySelector('[part="tab-people"]') as HTMLButtonElement).click();
    const onInvite = vi.fn();
    element.addEventListener("invite", onInvite);

    (element.shadowRoot?.querySelector('[part="invite"]') as HTMLButtonElement).click();

    expect(onInvite).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expect.objectContaining({ itemId: "42", itemType: "file" }) }),
    );
  });

  it("emits close and closes when Done is pressed", async () => {
    const element = await openModal();
    const onClose = vi.fn();
    element.addEventListener("close", onClose);

    (element.shadowRoot?.querySelector('[part="done"]') as HTMLButtonElement).click();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(element.open).toBe(false);
  });

  it("shows an error state when loading fails", async () => {
    const dataSource = createDataSource({
      getShareState: vi.fn(async () => {
        throw new Error("offline");
      }),
    });
    const element = document.createElement("box-unified-share-modal") as BoxUnifiedShareModalElement;
    element.dataSource = dataSource;
    element.itemId = "42";
    element.open = true;
    document.body.append(element);

    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('[part="error"]')?.textContent).toContain("offline"),
    );
  });
});
