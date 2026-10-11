// Bundles the service worker (including @rotho/shared) and copies the manifest into dist/.
import { build } from "esbuild";
import { copyFile, mkdir, rm } from "node:fs/promises";

const outdir = "dist";

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: ["src/background.ts"],
  outfile: `${outdir}/background.js`,
  bundle: true,
  format: "esm",
  target: "chrome116",
  sourcemap: true,
  logLevel: "info",
});

await copyFile("manifest.json", `${outdir}/manifest.json`);
