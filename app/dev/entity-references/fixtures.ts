import type { EntityType } from "@/lib/types/entity-links";
import { isUUID, uuidToIdentifier } from "@/lib/utils/slug";

export interface ReferenceExample {
  key: string;
  label: string;
  type: EntityType;
  id: string;
  url: string;
  available: boolean;
  privateId?: string;
}

export interface ReferenceCase {
  label: string;
  content: string;
}

export const MISSING_ID = "00000000-0000-0000-0000-00000000000a";

export function referenceCases(example: ReferenceExample): ReferenceCase[] {
  const id = isUUID(example.id) ? uuidToIdentifier(example.id) : example.id;
  const path = new URL(example.url).pathname.split("/")[1];
  const reference = `@${example.type}:${id}`;
  const cases: ReferenceCase[] = [
    { label: "Full URL", content: example.url },
    { label: "Plain reference", content: reference },
    { label: "Bracketed reference", content: `@${example.type}:[${id}]` },
    { label: "Custom label", content: `@${example.type}:[${id}|custom label]` },
    {
      label: "Query string",
      content: example.url.replace(/(#.*)?$/, "?from=share$1"),
    },
    {
      label: "HTTP and www",
      content: example.url.replace(
        "https://nimble.nexus",
        "http://www.nimble.nexus"
      ),
    },
    {
      label: "Legacy domain",
      content: example.url.replace("nimble.nexus", "nimble.monster"),
    },
    { label: "Punctuation", content: `(${example.url}), then ${reference}!` },
    { label: "Emphasis", content: `**${example.url}** and *${reference}*` },
    {
      label: "Dice and conditions",
      content: `${example.url} deals 2d6+4 and causes [[Dazed|dazed]].`,
    },
    {
      label: "Repeated and mixed",
      content: `${example.url}, ${reference}, and ${example.url}.`,
    },
    { label: "List", content: `\n- ${example.url}\n- ${reference}` },
  ];
  if (isUUID(example.id)) {
    cases.push(
      {
        label: "Bare identifier URL",
        content: `https://nimble.nexus/${path}/${id}`,
      },
      {
        label: "Legacy UUID URL",
        content: `https://nimble.nexus/${path}/${example.id}`,
      },
      {
        label: "Trailing slash and fragment",
        content: `${example.url}/#details`,
      },
      {
        label: "Dice-like slug",
        content: `https://nimble.nexus/${path}/2d6-sword-${id}`,
      }
    );
  }
  const missing = uuidToIdentifier(MISSING_ID);
  cases.push(
    {
      label: "Missing URL",
      content: `https://nimble.nexus/${path}/${missing}`,
    },
    { label: "Missing reference", content: `@${example.type}:${missing}` },
    {
      label: "Missing custom label",
      content: `@${example.type}:[${missing}|must not display]`,
    }
  );
  if (example.privateId) {
    const privateId = uuidToIdentifier(example.privateId);
    cases.push(
      {
        label: "Nonpublic URL (must not resolve)",
        content: `https://nimble.nexus/${path}/${example.privateId}`,
      },
      {
        label: "Nonpublic reference (must not resolve)",
        content: `@${example.type}:${privateId}`,
      },
      {
        label: "Nonpublic custom label (must not resolve)",
        content: `@${example.type}:[${privateId}|must not display]`,
      }
    );
  }
  return cases;
}

const samplePath = "/items/example-0000000000000000000000000a";
export const REJECTED_URL_CASES: ReferenceCase[] = [
  { label: "External host", content: `https://example.com${samplePath}` },
  {
    label: "Lookalike host",
    content: `https://nimble.nexus.evil.com${samplePath}`,
  },
  {
    label: "Nexus name in credentials",
    content: `https://nimble.nexus@evil.com${samplePath}`,
  },
  {
    label: "Credentials on Nexus",
    content: `https://evil.com@nimble.nexus${samplePath}`,
  },
  {
    label: "Nonstandard port",
    content: `https://nimble.nexus:444${samplePath}`,
  },
  { label: "Relative URL", content: samplePath },
  { label: "Listing page", content: "https://nimble.nexus/items" },
  { label: "Creation page", content: "https://nimble.nexus/items/new" },
  { label: "Edit page", content: `https://nimble.nexus${samplePath}/edit` },
  {
    label: "API endpoint",
    content: "https://nimble.nexus/api/items/0000000000000000000000000a",
  },
  {
    label: "Invalid identifier",
    content: "https://nimble.nexus/items/not-a-valid-id",
  },
  { label: "Unsupported route", content: "https://nimble.nexus/u/dev" },
];

export function casesToContent(cases: ReferenceCase[]): string {
  return cases
    .map(({ label, content }) => `**${label}:** ${content}`)
    .join("\n\n");
}
