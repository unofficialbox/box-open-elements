// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FormattedDuration } from "../../../src/components/output/formatted-duration.js";

const mount = (attrs: Record<string, string>): FormattedDuration => {
  const element = document.createElement("box-formatted-duration") as FormattedDuration;
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

describe("box-formatted-duration", () => {
  beforeEach(() => {
    FormattedDuration.register();
  });

  it("takes a count of seconds, which is what an API field holds", () => {
    expect(text(mount({ value: "5400", locale: "en-US" }))).toBe("1 hr, 30 min");
  });

  it("takes an ISO 8601 duration, which is what a datetime attribute holds", () => {
    expect(text(mount({ value: "PT1H30M", locale: "en-US" }))).toBe("1 hr, 30 min");
  });

  it("keeps the exact quantity in datetime whichever form came in", () => {
    // The visible text is a rounded summary; the attribute is what a crawler or
    // an extension reads.
    expect(valueEl(mount({ value: "5400" })).tagName).toBe("TIME");
    expect(valueEl(mount({ value: "5400" })).getAttribute("datetime")).toBe("PT1H30M");
    expect(valueEl(mount({ value: "PT1H30M" })).getAttribute("datetime")).toBe("PT1H30M");
  });

  it("renders each width", () => {
    const at = (formatStyle: string): string =>
      text(mount({ value: "5400", "format-style": formatStyle, locale: "en-US" }));

    expect(at("long")).toBe("1 hour, 30 minutes");
    expect(at("short")).toBe("1 hr, 30 min");
    expect(at("narrow")).toBe("1h 30m");
  });

  it("ignores an unrecognised width rather than passing it to Intl", () => {
    expect(
      text(mount({ value: "5400", "format-style": "enormous", locale: "en-US" })),
    ).toBe("1 hr, 30 min");
  });

  it("formats in the reader's locale", () => {
    expect(text(mount({ value: "5400", "format-style": "long", locale: "de-DE" }))).toBe(
      "1 Stunde, 30 Minuten",
    );
  });

  it("shows two units by default, and honours a different limit", () => {
    // 1 day, 3 hours, 12 minutes, 8 seconds.
    const seconds = String(86_400 + 3 * 3_600 + 12 * 60 + 8);

    expect(text(mount({ value: seconds, locale: "en-US" }))).toBe("1 day, 3 hr");
    expect(text(mount({ value: seconds, "max-units": "3", locale: "en-US" }))).toBe(
      "1 day, 3 hr, 12 min",
    );
    expect(text(mount({ value: seconds, "max-units": "1", locale: "en-US" }))).toBe("1 day");
  });

  it("drops a trailing zero unit, so an exact hour is not '1 hr, 0 min'", () => {
    expect(text(mount({ value: "3600", locale: "en-US" }))).toBe("1 hr");
    expect(text(mount({ value: "86400", locale: "en-US" }))).toBe("1 day");
  });

  it("renders zero rather than an empty element", () => {
    // Intl.DurationFormat formats a zero duration to the empty string, which
    // would leave the element visible with nothing in it. Zero is a real answer.
    const element = mount({ value: "0", locale: "en-US" });

    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).toBe("0 sec");
    expect(valueEl(element).getAttribute("datetime")).toBe("PT0S");
  });

  it("does not append a zero unit the split did not produce", () => {
    // Forcing seconds to display is only for a zero duration. Asked for
    // unconditionally it appends "0 sec" to every other duration in browsers
    // that honour the option — which Node's Intl quietly does not, so this
    // passed in jsdom while being visibly wrong in Chromium.
    for (const style of ["short", "long", "narrow"]) {
      const rendered = text(
        mount({ value: "5400", "format-style": style, locale: "en-US" }),
      );
      expect(rendered).not.toMatch(/0\s*(s|sec|second)/);
    }

    expect(text(mount({ value: "P1DT2H", locale: "en-US" }))).toBe("1 day, 2 hr");
  });

  it("hides itself for a value it cannot parse", () => {
    expect(mount({ value: "banana" }).hasAttribute("hidden")).toBe(true);
    expect(mount({ value: "" }).hasAttribute("hidden")).toBe(true);
  });

  it("refuses a negative duration, which is a host bug not a direction", () => {
    // box-relative-time is the component that expresses "ago".
    expect(mount({ value: "-60" }).hasAttribute("hidden")).toBe(true);
  });

  it("refuses months and years, which are not fixed spans of seconds", () => {
    // P1M is also ambiguous with a minute in the ISO time component; rendering
    // either as a fixed duration would misstate how long it is.
    expect(mount({ value: "P1M" }).hasAttribute("hidden")).toBe(true);
    expect(mount({ value: "P1Y" }).hasAttribute("hidden")).toBe(true);
  });

  it("composes the same output when Intl.DurationFormat is missing", () => {
    // The fallback exists for browsers without DurationFormat, which is most of
    // the reason to have it — and a fallback nothing exercises is one nobody
    // knows is broken.
    const original = (Intl as { DurationFormat?: unknown }).DurationFormat;
    delete (Intl as { DurationFormat?: unknown }).DurationFormat;

    try {
      const at = (formatStyle: string): string =>
        text(mount({ value: "5400", "format-style": formatStyle, locale: "en-US" }));

      expect(at("long")).toBe("1 hour, 30 minutes");
      expect(at("short")).toBe("1 hr, 30 min");
      expect(at("narrow")).toBe("1h 30m");
    } finally {
      (Intl as { DurationFormat?: unknown }).DurationFormat = original;
    }
  });

  it("survives a locale Intl rejects, keeping the machine form", () => {
    const element = mount({ value: "5400", locale: "not a locale" });

    expect(element.hasAttribute("hidden")).toBe(false);
    expect(text(element)).toBe("PT1H30M");
  });
});
