import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        // Node globals for scripts/tests
        process: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    rules: {
      // TypeScript-specific rules
      ...tseslint.configs.recommended.rules,

      // Require explicit return types on exported functions
      // This encourages thinking about the API contract
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],

      // Require explicit types on exported module boundaries
      "@typescript-eslint/explicit-module-boundary-types": "warn",

      // Prefer type over interface for consistency with discriminated unions
      "@typescript-eslint/consistent-type-definitions": ["warn", "type"],

      // Unused variables - error, but allow underscore prefix for intentionally unused
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // No explicit any - warn to encourage proper typing
      "@typescript-eslint/no-explicit-any": "warn",

      // React hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Disable base ESLint rules that conflict with TypeScript
      "no-unused-vars": "off",
      "no-undef": "off", // TypeScript handles this
    },
  },
  // Prettier config must be last to override formatting rules
  prettier,
  {
    // Ignore patterns
    ignores: ["node_modules/", "dist/", "*.config.js", "*.config.ts"],
  },
];

