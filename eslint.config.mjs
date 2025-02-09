import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigGoogle from "eslint-config-google";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  {
    ...eslintConfigGoogle,
    rules: {
      "require-jsdoc": "off",
      "max-len": ["error", { code: 120 }],
    },
  },
];