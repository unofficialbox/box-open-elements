import { afterEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({ connect: vi.fn(), disconnect: vi.fn(), rendered: vi.fn(), finish: vi.fn(), replay: vi.fn() }));
vi.mock("../../../src/patterns/insights/chart-motion.js", () => ({ ChartMotion: class {
  connect = calls.connect; disconnect = calls.disconnect; rendered = calls.rendered; finish = calls.finish; replay = calls.replay;
} }));
import { MetricCard } from "../../../src/patterns/insights/metric-card.js";
afterEach(async () => { document.body.replaceChildren(); await vi.dynamicImportSettled(); vi.clearAllMocks(); });
it("keeps a static card independent of motion, including explicit replay/finish calls", async () => {
  const card = new MetricCard(); document.body.append(card); card.value = "42"; card.replayAnimation(); card.finishAnimation();
  await vi.dynamicImportSettled(); expect(calls.connect).not.toHaveBeenCalled();
  expect(card.shadowRoot!.querySelector('[part="value"]')!.textContent).toBe("42");
});
it.each(["removed", "disabled"])("does not attach optional motion when %s before the import settles", async state => {
  const card = new MetricCard(); card.animated = true; document.body.append(card);
  if (state === "removed") card.remove(); else card.animated = false;
  await vi.dynamicImportSettled(); expect(calls.connect).not.toHaveBeenCalled();
});
it("connects once, uses current options, and tears down across reconnects", async () => {
  const card = new MetricCard(); document.body.append(card); card.animated = true; card.animationDuration = 200; card.value = "24";
  await vi.dynamicImportSettled(); expect(calls.connect).toHaveBeenCalledOnce(); expect(calls.rendered).toHaveBeenCalledWith(true);
  card.animationPaused = true; expect(calls.rendered).toHaveBeenLastCalledWith(false);
  card.replayAnimation(); expect(calls.replay).toHaveBeenCalledOnce();
  card.remove(); expect(calls.disconnect).toHaveBeenCalledOnce();
  document.body.append(card); await vi.dynamicImportSettled(); expect(calls.connect).toHaveBeenCalledTimes(2);
  expect(card.shadowRoot!.querySelector('[part="value"]')!.textContent).toBe("24");
});
it("honors finish while motion is loading, and allows explicit replay afterward", async () => {
  const card = new MetricCard(); card.animated = true; document.body.append(card); card.finishAnimation();
  await vi.dynamicImportSettled(); expect(calls.connect).toHaveBeenCalledOnce(); expect(calls.rendered).not.toHaveBeenCalled();
  card.replayAnimation(); expect(calls.replay).toHaveBeenCalledOnce();
});

it("does not suppress a later opt-in when finish was called on a static card", async () => {
  const card = new MetricCard(); document.body.append(card); card.finishAnimation(); card.animated = true;
  await vi.dynamicImportSettled(); expect(calls.rendered).toHaveBeenCalledWith(true);
});
