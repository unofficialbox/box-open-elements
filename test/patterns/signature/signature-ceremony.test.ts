import { afterEach, describe, expect, it } from "vitest";

import { SignatureCeremony } from "../../../src/patterns/signature/signature-ceremony.js";
import {
  formatCeremonySummary,
  resolveCeremony,
} from "../../../src/patterns/signature/types.js";
import type { Signatory } from "../../../src/patterns/signature/types.js";

SignatureCeremony.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const parties: Signatory[] = [
  { id: "morgan", name: "Morgan Lee", role: "Contract owner", signedAt: "2026-08-10T09:00:00.000Z" },
  { id: "avery", name: "Avery Chen", role: "General Counsel" },
  { id: "acme", name: "Dana Ruiz", role: "Counterparty" },
];

const states = (signatories: Signatory[], mode?: "sequential" | "parallel"): string[] =>
  resolveCeremony(signatories, mode).statuses.map(entry => entry.state);

const mount = async (
  configure: (element: SignatureCeremony) => void = () => {},
): Promise<SignatureCeremony> => {
  const element = document.createElement("box-signature-ceremony") as SignatureCeremony;
  element.signatories = parties;
  configure(element);
  document.body.append(element);
  await flush();
  return element;
};

const all = (element: SignatureCeremony, selector: string): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll(selector));

const q = (element: SignatureCeremony, selector: string): HTMLElement | null =>
  element.shadowRoot!.querySelector(selector);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("resolveCeremony — sequential", () => {
  it("grants exactly one turn, to the first unsigned party", () => {
    expect(states(parties)).toEqual(["signed", "awaiting", "waiting"]);
    expect(resolveCeremony(parties).awaiting.map(s => s.id)).toEqual(["avery"]);
  });

  it("never lets a later party appear actionable before an earlier one signs", () => {
    // The third party is unsigned in every arrangement below, and must stay
    // `waiting` until the second has signed — otherwise someone is shown a
    // sign-now affordance they cannot use.
    const noneSigned: Signatory[] = parties.map(({ signedAt: _drop, ...rest }) => rest);
    expect(states(noneSigned)).toEqual(["awaiting", "waiting", "waiting"]);

    const twoSigned = parties.map(party =>
      party.id === "avery" ? { ...party, signedAt: "2026-08-11T09:00:00.000Z" } : party,
    );
    expect(states(twoSigned)).toEqual(["signed", "signed", "awaiting"]);
  });

  it("reports completion once every party has signed", () => {
    const allSigned = parties.map(party => ({
      ...party,
      signedAt: party.signedAt ?? "2026-08-12T09:00:00.000Z",
    }));
    const resolution = resolveCeremony(allSigned);
    expect(resolution.status).toBe("completed");
    expect(resolution.awaiting).toEqual([]);
    expect(resolution.signedCount).toBe(3);
  });
});

describe("resolveCeremony — parallel", () => {
  it("grants every unsigned party a turn at once", () => {
    expect(states(parties, "parallel")).toEqual(["signed", "awaiting", "awaiting"]);
    expect(resolveCeremony(parties, "parallel").awaiting.map(s => s.id)).toEqual([
      "avery",
      "acme",
    ]);
  });
});

describe("resolveCeremony — a decline stops the ceremony", () => {
  const declined = parties.map(party =>
    party.id === "avery"
      ? { ...party, declinedAt: "2026-08-11T09:00:00.000Z", declineReason: "Cap unacceptable" }
      : party,
  );

  it("grants no turns to anyone behind the decline", () => {
    // A declined document is dead until the host revives it. Party three must
    // not be invited to sign against it.
    expect(states(declined)).toEqual(["signed", "declined", "waiting"]);
    expect(resolveCeremony(declined).awaiting).toEqual([]);
    expect(resolveCeremony(declined).status).toBe("declined");
  });

  it("grants no turns in parallel mode either, where everyone otherwise could act", () => {
    expect(states(declined, "parallel")).toEqual(["signed", "declined", "waiting"]);
    expect(resolveCeremony(declined, "parallel").awaiting).toEqual([]);
  });

  it("stops the ceremony even when the decline is last in the order", () => {
    const lastDeclined = parties.map(party =>
      party.id === "acme" ? { ...party, declinedAt: "2026-08-11T09:00:00.000Z" } : party,
    );
    expect(states(lastDeclined)).toEqual(["signed", "waiting", "declined"]);
    expect(resolveCeremony(lastDeclined).awaiting).toEqual([]);
  });

  it("counts a signature that was later declined as neither signed nor pending", () => {
    const both = [
      { id: "x", name: "Xu Wei", signedAt: "2026-08-10T09:00:00.000Z", declinedAt: "2026-08-11T09:00:00.000Z" },
    ];
    const resolution = resolveCeremony(both);
    expect(resolution.statuses[0]!.state).toBe("declined");
    expect(resolution.signedCount).toBe(0);
  });
});

describe("resolveCeremony — edges", () => {
  it("handles an empty roster without claiming completion", () => {
    const resolution = resolveCeremony([]);
    expect(resolution.status).toBe("in-progress");
    expect(resolution.statuses).toEqual([]);
    expect(resolution.total).toBe(0);
  });

  it("numbers parties from one, in roster order", () => {
    expect(resolveCeremony(parties).statuses.map(entry => entry.order)).toEqual([1, 2, 3]);
  });
});

describe("formatCeremonySummary", () => {
  it("states the phase", () => {
    expect(formatCeremonySummary(resolveCeremony(parties))).toBe("1 of 3 signed");
    expect(formatCeremonySummary(resolveCeremony([]))).toBe("No signatories");
    expect(
      formatCeremonySummary(
        resolveCeremony(parties.map(p => ({ ...p, signedAt: p.signedAt ?? "2026-08-12T09:00:00.000Z" }))),
      ),
    ).toBe("Fully executed");
    expect(
      formatCeremonySummary(
        resolveCeremony(parties.map(p => (p.id === "avery" ? { ...p, declinedAt: "2026-08-11T09:00:00.000Z" } : p))),
      ),
    ).toBe("Declined");
  });
});

describe("box-signature-ceremony", () => {
  it("renders one row per party, in order, carrying its state", async () => {
    const element = await mount();

    expect(all(element, '[part="party"]').map(n => n.getAttribute("data-signatory-id"))).toEqual([
      "morgan",
      "avery",
      "acme",
    ]);
    expect(all(element, '[part="party"]').map(n => n.getAttribute("data-state"))).toEqual([
      "signed",
      "awaiting",
      "waiting",
    ]);
    expect(all(element, '[part="order"]').map(n => n.textContent)).toEqual(["1", "2", "3"]);
  });

  it("states each party's position in words, not only in colour", async () => {
    const element = await mount();

    expect(all(element, '[part="state"]').map(n => n.textContent?.trim())).toEqual([
      "Signed Aug 10, 2026",
      "Awaiting signature",
      "Not yet their turn",
    ]);
  });

  it("falls back to the bare state when a timestamp will not parse", async () => {
    const element = await mount(el => {
      el.signatories = [{ id: "x", name: "Xu Wei", signedAt: "not-a-date" }];
    });
    // Never "Signed " with nothing after it.
    expect(q(element, '[part="state"]')?.textContent?.trim()).toBe("Signed");
  });

  it("summarises the ceremony", async () => {
    const element = await mount();
    const summary = q(element, '[part="summary"]');
    expect(summary?.textContent).toBe("1 of 3 signed");
    expect(summary?.getAttribute("data-status")).toBe("in-progress");
  });

  it("shows a decline with its reason and stops inviting anyone else", async () => {
    const element = await mount(el => {
      el.signatories = parties.map(party =>
        party.id === "avery"
          ? { ...party, declinedAt: "2026-08-11T09:00:00.000Z", declineReason: "Cap unacceptable" }
          : party,
      );
    });

    expect(all(element, '[part="party"]').map(n => n.getAttribute("data-state"))).toEqual([
      "signed",
      "declined",
      "waiting",
    ]);
    expect(q(element, '[part="reason"]')?.textContent).toBe("Cap unacceptable");
    expect(q(element, '[part="summary"]')?.getAttribute("data-status")).toBe("declined");
    expect(element.resolution.awaiting).toEqual([]);
  });

  it("says the ceremony stopped rather than 'not yet their turn' after a decline", async () => {
    const element = await mount(el => {
      el.signatories = parties.map(party =>
        party.id === "avery" ? { ...party, declinedAt: "2026-08-11T09:00:00.000Z" } : party,
      );
    });

    // Their turn is not coming, so saying it has not arrived yet would mislead.
    const details = all(element, '[part="state"]').map(n => n.textContent?.trim());
    expect(details[2]).toBe("Ceremony stopped");
    expect(details).not.toContain("Not yet their turn");
  });

  it("opens every turn in parallel mode", async () => {
    const element = await mount(el => (el.mode = "parallel"));

    expect(all(element, '[part="party"]').map(n => n.getAttribute("data-state"))).toEqual([
      "signed",
      "awaiting",
      "awaiting",
    ]);
  });

  it("derives initials for the avatar", async () => {
    const element = await mount();
    expect(all(element, '[part="avatar"]').map(n => n.textContent)).toEqual(["ML", "AC", "DR"]);
  });

  it("shows an empty state rather than claiming completion", async () => {
    const element = await mount(el => {
      el.signatories = [];
    });
    expect(q(element, '[part="empty"]')).not.toBeNull();
    expect(q(element, '[part="summary"]')?.textContent).toBe("No signatories");
  });

  it("escapes hostile party content", async () => {
    const element = await mount(el => {
      el.signatories = [
        {
          id: "<img src=x onerror=alert(1)>",
          name: "<script>alert('n')</script>",
          role: "<i>role</i>",
          declinedAt: "2026-08-11T09:00:00.000Z",
          declineReason: "<b>reason</b>",
        },
      ];
    });

    expect(element.shadowRoot!.querySelector("script")).toBeNull();
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector("i")).toBeNull();
    expect(element.shadowRoot!.querySelector("b")).toBeNull();
    expect(q(element, '[part="name"]')?.textContent).toBe("<script>alert('n')</script>");
    expect(q(element, '[part="reason"]')?.textContent).toBe("<b>reason</b>");
  });

  it("ignores a malformed signatories payload", async () => {
    const element = document.createElement("box-signature-ceremony") as SignatureCeremony;
    element.setAttribute("signatories", '[{"id":"ok","name":"Fine"},{"name":"no id"}]');
    document.body.append(element);
    await flush();

    expect(element.signatories).toEqual([]);
    expect(q(element, '[part="empty"]')).not.toBeNull();
  });
});
