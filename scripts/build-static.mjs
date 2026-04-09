import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const outputRoot = resolve(root, "dist/public");
const siteDist = resolve(root, "apps/site/dist");
const portalDist = resolve(root, "apps/portal/dist");

if (existsSync(outputRoot)) {
  rmSync(outputRoot, { recursive: true, force: true });
}
mkdirSync(outputRoot, { recursive: true });

if (!existsSync(siteDist)) {
  throw new Error("apps/site/dist does not exist. Run site build first.");
}

if (!existsSync(portalDist)) {
  throw new Error("apps/portal/dist does not exist. Run portal build first.");
}

cpSync(siteDist, outputRoot, { recursive: true });
cpSync(portalDist, resolve(outputRoot, "portal"), { recursive: true });

console.log("Static bundle assembled at dist/public");
