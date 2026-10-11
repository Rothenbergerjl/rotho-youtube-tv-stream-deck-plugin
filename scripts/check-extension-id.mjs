// Verifies the built extension's manifest key produces the EXTENSION_ID the plugin trusts.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("packages/extension/dist/manifest.json", "utf8"));
const shared = readFileSync("packages/shared/src/index.ts", "utf8");
const expected = shared.match(/EXTENSION_ID = "([a-p]{32})"/)?.[1];

const hex = createHash("sha256").update(Buffer.from(manifest.key, "base64")).digest("hex");
const actual = [...hex.slice(0, 32)].map((h) => String.fromCharCode(97 + parseInt(h, 16))).join("");

if (actual !== expected) {
  console.error(`Extension ID mismatch: manifest key gives ${actual}, shared expects ${expected}`);
  process.exit(1);
}
console.log(`Extension ID OK: ${actual}`);
