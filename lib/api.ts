import { NextResponse } from "next/server";
import { addCorsHeaders } from "@/lib/cors";

const CONTENT_TYPE = "application/vnd.api+json";

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
