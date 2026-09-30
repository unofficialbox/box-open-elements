import { afterEach, describe, expect, it } from "vitest";
import { SegmentedControl } from "../../src/components/actions/segmented-control.js";
import { TextField } from "../../src/components/forms/text-field.js";
import { DateField } from "../../src/components/forms/date-field.js";
import { NumberInput } from "../../src/components/forms/number-input.js";
import { SearchField } from "../../src/components/forms/search-field.js";
import { Select } from "../../src/components/forms/select.js";
import { ProgressBar } from "../../src/components/feedback/progress-bar.js";
import { Alert } from "../../src/components/feedback/alert.js";
import { Button } from "../../src/components/actions/button.js";
import { MetricCard } from "../../src/patterns/insights/metric-card.js";

afterEach(() => document.body.replaceChildren());
describe("consumer issue regressions", () => {
  it("preserves segment nodes and focus on controlled rerenders and changed values", () => {
    const control = new SegmentedControl();
    control.options = [
      { label: "Steps", value: "steps" },
      { label: "Code", value: "code" },
    ];
    document.body.append(control);
    const buttons =
      control.shadowRoot!.querySelectorAll<HTMLButtonElement>("button");
    buttons[0].focus();
    buttons[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    control.value = "code";
    control.options = control.options.map((option) => ({ ...option }));
    expect(control.shadowRoot!.activeElement).toBe(buttons[1]);
    control.value = "steps";
    expect(control.shadowRoot!.activeElement).toBe(buttons[1]);
    expect(buttons[0].getAttribute("aria-checked")).toBe("true");
    control.disabled = true;
    expect(buttons[0].disabled).toBe(true);
  });
  it.each([TextField, DateField, NumberInput, SearchField, Select])(
    "names %s with only its label, keeping help separate",
    (Field) => {
      const field = new Field();
      field.label = "Name";
      field.description = "Help text";
      field.required = true;
      document.body.append(field);
      const control = field.shadowRoot!.querySelector("input,select")!;
      const label = field.shadowRoot!.getElementById(
        control.getAttribute("aria-labelledby")!,
      )!;
      expect(label.textContent).toBe("Name*");
      expect(
        label.querySelector(".boe-required-mark")?.getAttribute("aria-hidden"),
      ).toBe("true");
      expect(
        field.shadowRoot!.getElementById(
          control.getAttribute("aria-describedby")!,
        )?.textContent,
      ).toBe("Help text");
      field.description = "";
      expect(control.hasAttribute("aria-describedby")).toBe(false);
    },
  );
  it("keeps progress correct regardless of max/value assignment order", () => {
    for (const order of [true, false]) {
      const bar = new ProgressBar();
      document.body.append(bar);
      if (order) {
        bar.value = 25;
        bar.max = 25;
      } else {
        bar.max = 25;
        bar.value = 25;
      }
      expect(
        bar.shadowRoot!.querySelector<HTMLElement>("[part=indicator]")!.style
          .width,
      ).toBe("100%");
      expect(
        bar
          .shadowRoot!.querySelector("[role=progressbar]")!
          .getAttribute("aria-valuenow"),
      ).toBe("25");
    }
  });
  it("ships narrow sizing, sentence case, stronger dismiss text and an outer focus ring", () => {
    const input = new NumberInput();
    const alert = new Alert();
    const button = new Button();
    const metric = new MetricCard();
    document.body.append(input, alert, button, metric);
    expect(input.shadowRoot!.querySelector("style")!.textContent).toContain(
      "min-width: 0",
    );
    expect(alert.shadowRoot!.querySelector("style")!.textContent).toMatch(
      /\[part="dismiss"\][\s\S]*?color: var\(--boe-token-text-text,/,
    );
    expect(button.shadowRoot!.querySelector("style")!.textContent).toContain(
      "0 0 0 5px",
    );
    expect(
      metric.shadowRoot!.querySelector("style")!.textContent,
    ).not.toContain("text-transform: uppercase");
  });
});
