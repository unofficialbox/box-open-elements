#!/usr/bin/env bun
/**
 * CLI: bun run style-bridge -- --config <cfg.json> --input <file> [--out <file>] [--report <file>]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { bridgeStylesheet, type BridgeConfig } from "./bridge.ts";

const usage = `Usage:
  bun tools/style-bridge/cli.ts --config <config.json> --input <source.css|scss> [--out <out.css>] [--report <report.json>]
`;

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const configPath = flag("--config");
const inputPath = flag("--input");
const outPath = flag("--out");
const reportPath = flag("--report");

if (!configPath || !inputPath) {
  console.error(usage);
  process.exit(1);
}

const config = JSON.parse(readFileSync(resolve(configPath), "utf8")) as BridgeConfig;
const inputAbs = resolve(inputPath);
const source = readFileSync(inputAbs, "utf8");
const inputDir = dirname(inputAbs);

const { css, report } = bridgeStylesheet(source, config, {
  resolveImport: specifier => {
    try {
      return readFileSync(resolve(inputDir, specifier), "utf8");
    } catch {
      return null;
    }
  },
});

if (outPath) {
  const abs = resolve(outPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, css, "utf8");
  console.log(`wrote ${abs}`);
} else {
  process.stdout.write(css);
}

if (reportPath) {
  const abs = resolve(reportPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`wrote ${abs}`);
} else {
  console.error(JSON.stringify(report));
}
