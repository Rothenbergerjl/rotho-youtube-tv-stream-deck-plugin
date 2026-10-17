// Bundles the service worker, content scripts and options page (including @rotho/shared), copies
// the manifest and options HTML, and renders the icons into dist/.
import { build } from "esbuild";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { ICON_SIZES, renderIcon } from "./icons/render.ts";

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

await build({
  entryPoints: ["src/options.ts"],
  outfile: `${outdir}/options.js`,
  bundle: true,
  format: "esm",
  target: "chrome116",
  sourcemap: true,
  logLevel: "info",
});

for (const name of ["content", "paramount-content"]) {
  await build({
    entryPoints: [`src/${name}.ts`],
    outfile: `${outdir}/${name}.js`,
    bundle: true,
    // Content scripts are classic scripts, not modules.
    format: "iife",
    target: "chrome116",
    sourcemap: true,
    logLevel: "info",
  });
}

await copyFile("manifest.json", `${outdir}/manifest.json`);
await copyFile("src/options.html", `${outdir}/options.html`);

await mkdir(`${outdir}/icons`);
for (const size of ICON_SIZES) {
  await writeFile(`${outdir}/icons/icon-${size}.png`, renderIcon(size));
}
