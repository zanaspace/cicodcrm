import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Architecture rules (docs/CONVENTIONS.md): screens and shared components get data only through
    // feature hooks (TanStack Query) and services, never from the mock stores or a raw fetch.
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    ignores: ["src/app/api/**", "src/app/(dashboard)/crm/roadmap/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^@/lib/mock/(?!seed/)",
          importNamePattern: "^(use[A-Z][A-Za-z0-9_]*|[A-Za-z0-9_]+Store)$",
          message: "Read data through a feature hook in src/features/* (TanStack Query), not a mock store.",
        }],
      }],
      "no-restricted-globals": ["error", {
        name: "fetch",
        message: "Call the backend through a service in src/services/* (lib/api-client), not fetch.",
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
