// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  FormattedDate,
  FormattedFileSize,
  FormattedNumber,
  RelativeTime,
} from "../../../src/components/output/index.js";

const mount = <T extends HTMLElement>(tag: string, attrs: Record<string, string>): T => {
  const element = document.createElement(tag) as T;
  for (const [name, value] of Object.entries(attrs)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  return element;
};

const text = (element: HTMLElement): string =>
  element.shadowRoot?.querySelector('[part="value"]')?.textContent ?? "";

const valueEl = (element: HTMLElement): HTMLElement =>
  element.shadowRoot!.querySelector('[part="value"]')!;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-formatted-date", () => {
  beforeEach(() => {
    FormattedDate.register();
  });

  it("renders in the requested locale, not a hardcoded one", () => {
    const enGB = mount("box-formatted-date", {
      value: "2026-08-25T12:00:00Z",
      locale: "en-GB",
      "date-style": "short",
      "time-zone": "UTC",
    });
    const enUS = mount("box-formatted-date", {
      value: "2026-08-25T12:00:00Z",
      locale: "en-US",
      "date-style": "short",
      "time-zone": "UTC",
    });

    expect(text(enGB)).toBe("25/08/2026");
    expect(text(enUS)).toBe("8/25/26");
  });

  it("keeps the exact instant in a datetime attribute", () => {
    // The visible text is an approximation of what the reader wants; the
    // attribute is what a crawler or an extension reads.
    const element = mount("box-formatted-date", { value: "2026-08-25T12:00:00Z" });

    expect(valueEl(element).tagName).toBe("TIME");
    expect(valueEl(element).getAttribute("datetime")).toBe("2026-08-25T12:00:00.000Z");
  });

  it("shows a date but no time unless a time style is asked for", () => {
    const dateOnly = mount("box-formatted-date", {
      value: "2026-08-25T12:00:00Z",
      locale: "en-GB",
      "time-zone": "UTC",
    });
    const withTime = mount("box-formatted-date", {
      value: "2026-08-25T12:00:00Z",
      locale: "en-GB",
      "time-style": "short",
      "time-zone": "UTC",
    });

    expect(text(dateOnly)).not.toMatch(/\d{2}:\d{2}/);
    expect(text(withTime)).toMatch(/\d{2}:\d{2}/);
  });

  it("hides itself rather than rendering Invalid Date", () => {
    const element = mount("box-formatted-date", { value: "banana" });

    expect(element.hasAttribute("hidden")).toBe(true);
    expect(text(element)).toBe("");
  });

  it("falls back to ISO rather than hiding a real instant over a bad zone", () => {
    const element = mount("box-formatted-date", {
      value: "2026-08-25T12:00:00Z",
      "time-zone": "Mars/Olympus_Mons",
    });

    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).toBe("2026-08-25T12:00:00.000Z");
  });
});

describe("box-relative-time", () => {
  beforeEach(() => {
    RelativeTime.register();
  });

  it("measures against reference-time so it is deterministic", () => {
    // Without a pinned reference this component could not be tested or
    // screenshotted — the same reason box-due-badge has one.
    const element = mount("box-relative-time", {
      value: "2026-08-21T12:00:00Z",
      "reference-time": "2026-08-25T12:00:00Z",
      locale: "en",
      numeric: "always",
    });

    expect(text(element)).toBe("4 days ago");
  });

  it("uses the idiomatic form by default where the language has one", () => {
    const element = mount("box-relative-time", {
      value: "2026-08-24T12:00:00Z",
      "reference-time": "2026-08-25T12:00:00Z",
      locale: "en",
    });

    expect(text(element)).toBe("yesterday");
  });

  it("keeps the exact instant beside the approximation", () => {
    const element = mount("box-relative-time", {
      value: "2026-08-21T12:00:00Z",
      "reference-time": "2026-08-25T12:00:00Z",
    });

    expect(valueEl(element).getAttribute("datetime")).toBe("2026-08-21T12:00:00.000Z");
  });

  it("falls back to now when the reference is unparseable, keeping the value", () => {
    const element = mount("box-relative-time", {
      value: "2026-08-21T12:00:00Z",
      "reference-time": "not a time",
    });

    // The instant being described is still valid; a broken reference must not
    // erase it.
    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).not.toBe("");
  });

  it("hides itself when the value itself is unusable", () => {
    expect(mount("box-relative-time", { value: "" }).hasAttribute("hidden")).toBe(true);
  });
});

describe("box-formatted-number", () => {
  beforeEach(() => {
    FormattedNumber.register();
  });

  it("groups in the reader's locale", () => {
    expect(text(mount("box-formatted-number", { value: "1234567.5", locale: "en-US" }))).toBe(
      "1,234,567.5",
    );
    expect(text(mount("box-formatted-number", { value: "1234567.5", locale: "de-DE" }))).toBe(
      "1.234.567,5",
    );
  });

  it("uses format-style, because style is a global HTML attribute", () => {
    // Naming it `style` would put CSS on the host and be silently ignored as a
    // formatting instruction.
    const element = mount("box-formatted-number", {
      value: "1234.5",
      "format-style": "currency",
      currency: "USD",
      locale: "en-US",
    });

    expect(element.getAttribute("style")).toBeNull();
    expect(text(element)).toBe("$1,234.50");
  });

  it("follows Intl on percent, which multiplies by 100", () => {
    expect(
      text(mount("box-formatted-number", { value: "0.42", "format-style": "percent", locale: "en-US" })),
    ).toBe("42%");
  });

  it("renders a plain number rather than hiding one over a missing currency", () => {
    const element = mount("box-formatted-number", {
      value: "1234.5",
      "format-style": "currency",
      locale: "en-US",
    });

    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).toBe("1,234.5");
  });

  it("survives a bad currency code without losing the number", () => {
    const element = mount("box-formatted-number", {
      value: "10",
      "format-style": "currency",
      currency: "NOTACODE",
    });

    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).toContain("10");
  });

  it("writes a unit at the requested width", () => {
    const short = mount("box-formatted-number", {
      value: "2.5", "format-style": "unit", unit: "megabyte", locale: "en-US",
    });
    const long = mount("box-formatted-number", {
      value: "2.5", "format-style": "unit", unit: "megabyte", "unit-display": "long", locale: "en-US",
    });

    expect(text(short)).toBe("2.5 MB");
    // `long` is for prose, where an abbreviation the reader has to expand in
    // their head is worse than the words.
    expect(text(long)).toBe("2.5 megabytes");
  });

  it("drops the space on narrow, which is the whole point of it", () => {
    // The only difference from `short` is the separator, so a regression here
    // would be invisible in a diff that only checked the unit survived.
    expect(
      text(mount("box-formatted-number", {
        value: "2.5", "format-style": "unit", unit: "megabyte", "unit-display": "narrow", locale: "en-US",
      })),
    ).toBe("2.5MB");
  });

  it("defaults the unit width to short, which is what a table wants", () => {
    expect(
      text(mount("box-formatted-number", {
        value: "8", "format-style": "unit", unit: "hour", locale: "en-US",
      })),
    ).toBe("8 hr");
  });

  it("ignores an unrecognised unit width rather than passing it to Intl", () => {
    expect(
      text(mount("box-formatted-number", {
        value: "8", "format-style": "unit", unit: "hour", "unit-display": "enormous", locale: "en-US",
      })),
    ).toBe("8 hr");
  });

  it("renders a plain number rather than hiding one over a missing unit", () => {
    const element = mount("box-formatted-number", {
      value: "2.5", "format-style": "unit", locale: "en-US",
    });

    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).toBe("2.5");
  });

  it("survives a unit Intl does not sanction", () => {
    // Intl accepts a closed list and throws on anything else; "widgets" is not
    // a unit, but the number is still real.
    const element = mount("box-formatted-number", {
      value: "12", "format-style": "unit", unit: "widgets",
    });

    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).toContain("12");
  });

  it("hides itself for a non-numeric value", () => {
    expect(mount("box-formatted-number", { value: "banana" }).hasAttribute("hidden")).toBe(true);
  });
});

describe("box-formatted-file-size", () => {
  beforeEach(() => {
    FormattedFileSize.register();
  });

  it("renders decimal units by default", () => {
    expect(text(mount("box-formatted-file-size", { value: "2517630", locale: "en-US" }))).toBe(
      "2.5 MB",
    );
  });

  it("localises the separator, which is the reason this is a component", () => {
    expect(text(mount("box-formatted-file-size", { value: "2517630", locale: "de-DE" }))).toBe(
      "2,5 MB",
    );
  });

  it("switches to IEC names on binary units", () => {
    expect(
      text(mount("box-formatted-file-size", { value: "1048576", units: "binary", locale: "en-US" })),
    ).toBe("1 MiB");
  });

  it("shows whole bytes below the first threshold", () => {
    expect(text(mount("box-formatted-file-size", { value: "512", locale: "en-US" }))).toBe("512 B");
  });

  it("does not use a time element, which would be a semantic lie", () => {
    expect(valueEl(mount("box-formatted-file-size", { value: "1000" })).tagName).toBe("SPAN");
  });

  it("hides itself for a non-numeric value", () => {
    expect(mount("box-formatted-file-size", { value: "" }).hasAttribute("hidden")).toBe(true);
  });
});

describe("the shared renderer", () => {
  beforeEach(() => {
    FormattedNumber.register();
  });

  it("reappears when a broken value is replaced with a good one", () => {
    const element = mount("box-formatted-number", { value: "banana" });
    expect(element.hasAttribute("hidden")).toBe(true);

    element.setAttribute("value", "42");
    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).toBe("42");
  });

  it("offers tabular figures for column alignment", () => {
    const styles =
      mount("box-formatted-number", { value: "1" }).shadowRoot?.querySelector("style")
        ?.textContent ?? "";

    expect(styles).toContain("font-variant-numeric: tabular-nums");
    expect(styles).toContain(":host([tabular])");
  });
});
