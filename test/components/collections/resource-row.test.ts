// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ResourceRow } from "../../../src/components/collections/resource-row.js";

describe("box-resource-row", () => {
  beforeEach(() => { ResourceRow.register(); });
  afterEach(() => { document.body.innerHTML = ""; });
  const mount = (): ResourceRow => {
    const row = document.createElement("box-resource-row") as ResourceRow;
    row.label = "Production Box";
    row.meta = "Enterprise 12345\nLast checked today";
    row.status = "Ready";
    row.value = "production";
    const action = document.createElement("button");
    action.slot = "actions";
    action.textContent = "Remove";
    action.setAttribute("aria-label", "Remove Production Box");
    row.append(action);
    document.body.append(row);
    return row;
  };
  it("keeps selection and secondary actions separate", () => {
    const row = mount();
    const events: string[] = [];
    row.addEventListener("select", (event) => events.push((event as CustomEvent).detail.value));
    const select = row.shadowRoot!.querySelector("button")!;
    expect(select.getAttribute("aria-label")).toBe("Production Box");
    expect(select.getAttribute("aria-pressed")).toBe("false");
    select.click();
    row.querySelector("button")!.click();
    expect(events).toEqual(["production"]);
    row.selected = true;
    expect(select.getAttribute("aria-pressed")).toBe("true");
  });
  it("disables only selection and keeps metadata readable", () => {
    const row = mount();
    row.disabled = true;
    expect(row.shadowRoot!.querySelector("button")!.disabled).toBe(true);
    expect(row.querySelector("button")!.disabled).toBe(false);
    expect(row.shadowRoot!.querySelector('[part="meta"]')!.textContent).toContain("Enterprise 12345");
    expect(row.shadowRoot!.querySelector('[part="status"]')!.textContent).toBe("Ready");
  });
  it("describes a slotted status without requiring a duplicate status attribute", () => {
    const row = mount();
    row.removeAttribute("status");
    const badge = document.createElement("span");
    badge.slot = "status";
    badge.setAttribute("aria-label", "Ready for deployment");
    row.append(badge);
    row.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="status"]')!
      .dispatchEvent(new Event("slotchange"));
    expect(row.shadowRoot!.querySelector("button")!.getAttribute("aria-description"))
      .toContain("Ready for deployment");
  });
  it("defines a narrow-width stacking rule", () => {
    expect(rowStyle(mount())).toContain("@container (max-width: 320px)");
  });
});

const rowStyle = (row: ResourceRow): string => row.shadowRoot!.querySelector("style")!.textContent!;
