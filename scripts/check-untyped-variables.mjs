import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const inputs = process.argv.slice(2);

if (inputs.length === 0) {
  process.stderr.write("Usage: check-untyped-variables.mjs <path> [...paths]\n");
  process.exit(2);
}

const require = createRequire(import.meta.url);
const oxlint = join(dirname(require.resolve("oxlint/package.json")), "bin/oxlint");
const result = spawnSync(
  process.execPath,
  [
    oxlint,
    "-A",
    "all",
    "-D",
    "init-declarations",
    "--disable-nested-config",
    "-f",
    "json",
    ...inputs,
  ],
  { encoding: "utf8" },
);

if (result.error) throw result.error;

const report = parseReport(result);

let errors = 0;

for (const diagnostic of report.diagnostics) {
  const label = diagnostic.labels[0];
  const { span } = label;
  const declaration = readFileSync(diagnostic.filename, "utf8").slice(
    span.offset,
    span.offset + span.length,
  );

  if (declaration.includes(":")) continue;

  const name = diagnostic.message.match(/Variable '(.+)'/)?.[1] ?? declaration;
  process.stderr.write(
    `${diagnostic.filename}:${span.line}:${span.column}: error untyped-variable: ` +
      `Uninitialized variable '${name}' requires an explicit type annotation.\n`,
  );
  errors++;
}

if (errors > 0) process.exitCode = 1;

function parseReport(commandResult) {
  try {
    return JSON.parse(commandResult.stdout);
  } catch {
    process.stderr.write(commandResult.stderr || commandResult.stdout);
    process.exit(commandResult.status ?? 2);
  }
}
