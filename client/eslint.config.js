import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: ["./tsconfig.json"], // Specify the tsconfig for the client
      },
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
      prettier: prettierPlugin,
    },
    extends: [
      js.configs.recommended,
      tsPlugin.configs.recommended,
      prettierConfig,
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:jsx-a11y/recommended",
    ],
    rules: {
      "prettier/prettier": "error",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "warn", // Keep this for JS files, TS will handle it better
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);
