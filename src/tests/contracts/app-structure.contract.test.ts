// @vitest-environment node

import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = path.resolve(process.cwd(), "src/app");

const APP_ENTRY_FILES = new Set([
  "page.tsx",
  "page.ts",
  "layout.tsx",
  "layout.ts",
  "loading.tsx",
  "loading.ts",
  "error.tsx",
  "error.ts",
  "not-found.tsx",
  "not-found.ts",
  "template.tsx",
  "template.ts",
]);

const HTTP_METHOD_EXPORTS = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS", "HEAD"];

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(fullPath)));
    } else {
      out.push(fullPath);
    }
  }

  return out;
}

function hasDefaultExport(source: string): boolean {
  return /export\s+default\s+/m.test(source);
}

function hasHttpHandlerExport(source: string): boolean {
  return HTTP_METHOD_EXPORTS.some((method) => {
    const fnExport = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, "m");
    const constExport = new RegExp(`export\\s+const\\s+${method}\\s*=`, "m");
    return fnExport.test(source) || constExport.test(source);
  });
}

describe("App structure contracts", () => {
  it("all app entry files export default", async () => {
    const allFiles = await walk(APP_ROOT);
    const entryFiles = allFiles.filter((filePath) => APP_ENTRY_FILES.has(path.basename(filePath)));

    expect(entryFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const filePath of entryFiles) {
      const content = await fs.readFile(filePath, "utf8");
      if (!hasDefaultExport(content)) {
        violations.push(path.relative(process.cwd(), filePath));
      }
    }

    expect(violations, `Missing default export in app entry files:\n${violations.join("\n")}`).toEqual([]);
  });

  it("all API route files export at least one HTTP handler", async () => {
    const allFiles = await walk(APP_ROOT);
    const routeFiles = allFiles.filter((filePath) => path.basename(filePath) === "route.ts");

    expect(routeFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const filePath of routeFiles) {
      const content = await fs.readFile(filePath, "utf8");
      if (!hasHttpHandlerExport(content)) {
        violations.push(path.relative(process.cwd(), filePath));
      }
    }

    expect(
      violations,
      `API route files without handler export:\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});
