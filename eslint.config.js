import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/node_modules/", "**/dist/", "**/*.sdPlugin/bin/", "**/coverage/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}", "scripts/**"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["packages/extension/src/**"],
    languageOptions: { globals: { ...globals.browser, chrome: "readonly" } },
  },
);
