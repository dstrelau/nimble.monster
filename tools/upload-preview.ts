#!/usr/bin/env node
// Programmatic equivalent of the /admin upload form.
// Writes a preview session file and opens the preview URL in the browser.
//
// Usage: node tools/upload-preview.ts <path-to-json-file> [--port=3000]

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const LOCAL_DIR = join(process.cwd(), "tmp", "preview-sessions");

const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith("--"));
const portArg = args.find((a) => a.startsWith("--port="));
const port = portArg ? portArg.split("=")[1] : "3000";

if (!filePath) {
  console.error("Usage: node tools/upload-preview.ts <file.json> [--port=3000]");
  process.exit(1);
}

const json: unknown = JSON.parse(readFileSync(resolve(filePath), "utf-8"));

if (
  typeof json !== "object" ||
  json === null ||
  !("data" in json) ||
  !Array.isArray((json as { data: unknown }).data) ||
  (json as { data: unknown[] }).data.length === 0
) {
  console.error("Invalid JSON: expected an object with a non-empty 'data' array");
  process.exit(1);
}

const firstItem = (json as { data: Array<{ type?: string }> }).data[0];
const contentType = firstItem?.type;
const source = (json as { source?: unknown }).source;
const items = (json as { data: unknown[] }).data;

type SessionData = Record<string, unknown>;

function buildSessionData(type: string): { prefix: string; data: SessionData } {
  switch (type) {
    case "classes":
      return { prefix: "classes", data: { classes: items, source } };
    case "subclasses":
      return { prefix: "subclasses", data: { subclasses: items, source } };
    case "ancestries":
      return { prefix: "ancestries", data: { ancestries: items, source } };
    case "backgrounds":
      return { prefix: "backgrounds", data: { backgrounds: items, source } };
    case "spell-schools":
      return { prefix: "spell-schools", data: { spellSchools: items, source } };
    case "monsters": {
      const included = (json as { included?: unknown[] }).included ?? [];
      const families = included
        .filter(
          (item): item is { id: string; type: string } =>
            typeof item === "object" &&
            item !== null &&
            "type" in item &&
            (item as { type: string }).type === "families" &&
            "id" in item
        )
        .map((f) => [f.id, f] as [string, unknown]);
      return { prefix: "monsters", data: { monsters: items, families, source } };
    }
    default:
      console.error(
        `Unknown content type: "${type}". Expected "monsters", "ancestries", "backgrounds", "classes", "subclasses", or "spell-schools".`
      );
      process.exit(1);
  }
}

const { prefix, data } = buildSessionData(contentType ?? "");

const sessionKey = randomUUID();
const sessionData = { data, createdAt: Date.now() };
const dest = join(LOCAL_DIR, prefix, `${sessionKey}.json`);

mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, JSON.stringify(sessionData));

const url = `http://localhost:${port}/admin/${prefix}/preview?session=${sessionKey}`;
console.log(url);
execSync(`open ${url}`);
