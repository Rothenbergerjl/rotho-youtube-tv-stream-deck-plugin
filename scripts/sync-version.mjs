// Copies the root package.json version into every package.json and both manifests.
//   node scripts/sync-version.mjs          write the version everywhere
//   node scripts/sync-version.mjs --check  exit 1 if anything is out of sync (used by `pnpm package`)
import { readFileSync, writeFileSync } from "node:fs";

const check = process.argv.includes("--check");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const { version } = readJson("package.json");
// Chrome only accepts 1-4 dot-separated integers, so no pre-release suffixes.
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Root version ${JSON.stringify(version)} must be MAJOR.MINOR.PATCH`);
  process.exit(1);
}

/** [file, JSON key, expected value] */
const targets = [
  ["packages/shared/package.json", "version", version],
  ["packages/extension/package.json", "version", version],
  ["packages/plugin/package.json", "version", version],
  ["packages/extension/manifest.json", "version", version],
  // Stream Deck manifests use four parts.
  ["packages/plugin/com.rotho.yttv-multiview.sdPlugin/manifest.json", "Version", `${version}.0`],
];

let outOfSync = 0;
for (const [file, key, expected] of targets) {
  const json = readJson(file);
  if (json[key] === expected) continue;
  if (check) {
    console.error(
      `${file}: ${key} is ${JSON.stringify(json[key])}, expected ${JSON.stringify(expected)}`,
    );
    outOfSync++;
  } else {
    // Replace just the value so the file keeps its Prettier formatting.
    const text = readFileSync(file, "utf8");
    const from = `"${key}": ${JSON.stringify(json[key])}`;
    if (!text.includes(from)) throw new Error(`${file}: could not find ${from}`);
    writeFileSync(file, text.replace(from, `"${key}": ${JSON.stringify(expected)}`));
    console.log(`${file}: ${key} → ${expected}`);
  }
}

if (outOfSync) {
  console.error("Run `pnpm version:sync` to fix.");
  process.exit(1);
}
if (check) console.log(`All versions are ${version}`);
