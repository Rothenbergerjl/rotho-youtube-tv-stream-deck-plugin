// Zips the built extension (packages/extension/dist, without source maps) into
// dist/yttv-multiview-extension-<version>.zip for release and Chrome Web Store upload.
// The Web Store rejects a manifest with a "key" field (it keeps the ID itself), so the zip's
// manifest drops it; the source manifest keeps it so unpacked dev builds get the same ID.
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

const storeManifest = JSON.parse(readFileSync(path.join(source, "manifest.json"), "utf8"));
delete storeManifest.key;
const entries = Object.fromEntries(
  files.map((f) => [
    f,
    f === "manifest.json"
      ? Buffer.from(`${JSON.stringify(storeManifest, null, 2)}\n`)
      : readFileSync(path.join(source, f)),
  ]),
);
mkdirSync("dist", { recursive: true });
writeFileSync(output, zipSync(entries, { level: 9 }));
console.log(`${output}: ${files.join(", ")}`);
