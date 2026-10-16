// Based on the @elgato/cli plugin template. Everything (SDK, ws, @rotho/shared) is bundled into
// bin/plugin.js so the .sdPlugin folder never depends on pnpm's symlinked node_modules.
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { readFileSync } from "node:fs";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "com.rotho.yttv-multiview.sdPlugin";
// The release version; the plugin compares it with the latest GitHub release.
const { version } = JSON.parse(readFileSync("../../package.json", "utf8"));

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: "src/plugin.ts",
  output: {
    file: `${sdPlugin}/bin/plugin.js`,
    sourcemap: isWatching,
    sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
      return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
    },
  },
  plugins: [
    {
      name: "watch-externals",
      buildStart: function () {
        this.addWatchFile(`${sdPlugin}/manifest.json`);
      },
    },
    typescript({
      include: ["src/**/*.ts", "../shared/src/**/*.ts"],
      exclude: ["**/*.test.ts", "test/**"],
      noEmit: false,
      // Only test/fake-extension.ts needs this (it runs directly under Node); not valid when emitting.
      allowImportingTsExtensions: false,
      mapRoot: isWatching ? "./" : undefined,
    }),
    {
      name: "plugin-version",
      transform(code) {
        if (!code.includes("__PLUGIN_VERSION__")) return null;
        return { code: code.replaceAll("__PLUGIN_VERSION__", JSON.stringify(version)), map: null };
      },
    },
    nodeResolve({
      browser: false,
      exportConditions: ["node"],
      preferBuiltins: true,
    }),
    // ws loads the optional native add-ons bufferutil/utf-8-validate inside try/catch;
    // ignoreTryCatch (default) leaves those requires alone so the bundle runs without them.
    commonjs(),
    !isWatching && terser(),
    {
      name: "emit-module-package-file",
      generateBundle() {
        this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
      },
    },
  ],
};

export default config;
