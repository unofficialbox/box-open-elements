/** Zero-inclusive linear scales with readable 1/2/5 tick intervals. */
export const chartScale = (values: number[]) => {
  const finite = values.filter(Number.isFinite);
  let magnitude = 0;
  for (const value of finite) magnitude = Math.max(magnitude, Math.abs(value));
  magnitude ||= 1;
  let low = 0, high = 0;
  for (const value of finite) {
    low = Math.min(low, value / magnitude);
    high = Math.max(high, value / magnitude);
  }
  if (low === high) high = 1;
  let ticks = Array.from({ length: 5 }, (_, index) => (low + (high - low) * index / 4) * magnitude);

  // Normalize first: subtracting opposite finite extremes can overflow. Keep
  // the original finite bounds when a rounded endpoint cannot be represented.
  const rawStep = (high - low) / 4 * magnitude;
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const factor = rawStep / power;
  const multiple = factor < Math.SQRT2 ? 1 : factor < Math.sqrt(10) ? 2 : factor < Math.sqrt(50) ? 5 : 10;
  let step = multiple * power;
  let first = Math.floor(low * magnitude / step);
  let last = Math.ceil(high * magnitude / step);
  if (last - first > 5) {
    step = (multiple === 1 ? 2 : multiple === 2 ? 5 : multiple === 5 ? 10 : 20) * power;
    first = Math.floor(low * magnitude / step);
    last = Math.ceil(high * magnitude / step);
  }
  if (step > 0 && Number.isFinite(step) && Number.isFinite(first) && Number.isFinite(last) && last > first && last - first <= 10) {
    const niceLow = first * step, niceHigh = last * step;
    if (Number.isFinite(niceLow) && Number.isFinite(niceHigh)) {
      low = niceLow / magnitude;
      high = niceHigh / magnitude;
      ticks = Array.from({ length: last - first + 1 }, (_, index) => Number(((first + index) * step).toPrecision(14)));
    }
  }
  const position = (value: number) => (value / magnitude - low) / (high - low);
  return { position, ticks };
};
export const formatChartValue = (value: number): string => {
  if (value !== 0 && (Math.abs(value) >= 1e6 || Math.abs(value) < .001)) return value.toExponential(1).replace(/\.0e/, "e");
  return new Intl.NumberFormat("en", { maximumSignificantDigits: 4 }).format(value);
};
