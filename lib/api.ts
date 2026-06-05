import { NextResponse } from "next/server";
import { addCorsHeaders } from "@/lib/cors";

const CONTENT_TYPE = "application/vnd.api+json";

// Headers for a JSON:API response, including CORS.
export function jsonApiHeaders(): Headers {
  const headers = new Headers({ "Content-Type": CONTENT_TYPE });
  addCorsHeaders(headers);
  return headers;
}

// A JSON:API error response (single error object).
export function jsonApiError(status: number, title: string): NextResponse {
  return NextResponse.json(
    { errors: [{ status: String(status), title }] },
    { status, headers: jsonApiHeaders() }
  );
}

function includeErrorMessage(validIncludes: readonly string[]): string {
  const quoted = validIncludes.map((v) => `'${v}'`);
  let list: string;
  if (quoted.length <= 1) {
    list = quoted.join("");
  } else if (quoted.length === 2) {
    list = `${quoted[0]} and ${quoted[1]}`;
  } else {
    list = `${quoted.slice(0, -1).join(", ")}, and ${quoted[quoted.length - 1]}`;
  }
  const verb = validIncludes.length === 1 ? "is" : "are";
  return `Invalid include parameter. Only ${list} ${verb} supported.`;
}

type ParseIncludeResult =
  | { ok: true; resources: string[] }
  | { ok: false; response: NextResponse };

// Parses and validates a JSON:API `?include=` parameter against the set of
// relationship names a route supports. On an unsupported value, returns a ready
// 400 response; otherwise returns the parsed relationship names.
export function parseInclude(
  searchParams: URLSearchParams,
  validIncludes: readonly string[]
): ParseIncludeResult {
  const raw = searchParams.get("include") || undefined;
  const resources = raw ? raw.split(",").map((r) => r.trim()) : [];
  const invalid = resources.filter((r) => !validIncludes.includes(r));
  if (invalid.length > 0) {
    return {
      ok: false,
      response: jsonApiError(400, includeErrorMessage(validIncludes)),
    };
  }
  return { ok: true, resources };
}

export function apiRedirect(request: Request, path: string): NextResponse {
  const reqUrl = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ?? reqUrl.protocol.slice(0, -1);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    reqUrl.host;
  const headers = new Headers({ "Content-Type": CONTENT_TYPE });
  addCorsHeaders(headers);
  return NextResponse.redirect(`${proto}://${host}${path}${reqUrl.search}`, {
    status: 308,
    headers,
  });
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}
