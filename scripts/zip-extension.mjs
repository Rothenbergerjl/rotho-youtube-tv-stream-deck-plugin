// Zips the built extension (packages/extension/dist, without source maps) into
// dist/yttv-multiview-extension-<version>.zip for release.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { zipSync } from "fflate";

const source = "packages/extension/dist";
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const output = `dist/yttv-multiview-extension-${version}.zip`;

/** Relative paths of every file under `dir`. */
function walk(dir, prefix = "") {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    return statSync(full).isDirectory() ? walk(full, rel) : [rel];
  });
}

const files = walk(source).filter((f) => !f.endsWith(".map"));
if (!files.includes("manifest.json")) {
  console.error(`${source}/manifest.json not found; run \`pnpm build\` first.`);
  process.exit(1);
}

const entries = Object.fromEntries(files.map((f) => [f, readFileSync(path.join(source, f))]));
mkdirSync("dist", { recursive: true });
writeFileSync(output, zipSync(entries, { level: 9 }));
console.log(`${output}: ${files.join(", ")}`);
