import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cssPath = resolve(process.cwd(), "apps/portal/src/styles.css");
const css = readFileSync(cssPath, "utf8");

const requiredTokens = [
  "--role-accent",
  "--role-glow",
  "--max-width",
  "--color-border",
  "--color-text"
];

const missing = requiredTokens.filter((token) => !css.includes(token));
if (missing.length > 0) {
  console.error(`Missing required design tokens in portal stylesheet: ${missing.join(", ")}`);
  process.exit(1);
}

if (/text-transform:\s*uppercase/.test(css)) {
  console.warn("Uppercase text-transform found in styles.css. Prefer sentence case for readability.");
}

console.log("Design token check passed.");
