import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const source = resolve(root, "packages/ui/src/tokens.css");
const targetDir = resolve(root, "packages/ui/dist");
const target = resolve(targetDir, "tokens.css");

if (!existsSync(source)) {
  throw new Error("Missing packages/ui/src/tokens.css");
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);

console.log("Copied UI token stylesheet to dist/tokens.css");
