// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Dialog } from "../../../src/components/overlays/dialog.js";

afterEach(() => { document.body.replaceChildren(); document.body.removeAttribute("style"); });
function pair(): [Dialog, Dialog] {
  const a = new Dialog(); const b = new Dialog();
  document.body.append(a, b); a.show(); b.show();
  return [a, b];
}
describe("Dialog shared scroll ownership", () => {
  it.each([0, 1])("keeps the page locked until the last dialog closes, order %s", first => {
    const dialogs = pair(); dialogs[first].close();
    expect(document.body.style.overflow).toBe("hidden");
    dialogs[1 - first].close(); expect(document.body.style.overflow).toBe("");
  });
  it.each([0, 1])("releases disconnected owners, order %s", first => {
    const dialogs = pair(); dialogs[first].remove();
    expect(document.body.style.overflow).toBe("hidden");
    dialogs[1 - first].remove(); expect(document.body.style.overflow).toBe("");
  });
  it("restores the original overflow value and priority", () => {
    document.body.style.setProperty("overflow", "auto", "important");
    const [a, b] = pair(); a.close(); b.close();
    expect(document.body.style.getPropertyValue("overflow")).toBe("auto");
    expect(document.body.style.getPropertyPriority("overflow")).toBe("important");
  });
  it.each([["scroll", ""], ["hidden", "important"]])("preserves a caller override %s %s", (value, priority) => {
    const [a, b] = pair(); document.body.style.setProperty("overflow", value, priority);
    a.close(); b.close();
    expect(document.body.style.getPropertyValue("overflow")).toBe(value);
    expect(document.body.style.getPropertyPriority("overflow")).toBe(priority);
  });
  it("reacquires on reconnect and releases after repeated close/reopen", () => {
    const [a, b] = pair(); a.remove(); document.body.append(a);
    b.close(); expect(document.body.style.overflow).toBe("hidden");
    a.close(); expect(document.body.style.overflow).toBe("");
    a.show(); a.close(); a.show(); a.close(); expect(document.body.style.overflow).toBe("");
  });
  it("does not acquire a lock for detached updates", () => {
    const a = new Dialog(); document.body.append(a); a.show(); a.remove();
    a.heading = "Detached"; a.close(); a.show();
    expect(document.body.style.overflow).toBe("");
    document.body.append(a); expect(document.body.style.overflow).toBe("hidden");
    a.close(); expect(document.body.style.overflow).toBe("");
  });
});
