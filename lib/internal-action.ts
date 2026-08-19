import { NextResponse } from "next/server";
import { telemetry } from "@/lib/telemetry";

export type InternalActionMediaType =
  | "application/json"
  | "multipart/form-data";

type InternalActionHandler<Args extends readonly unknown[]> = (
  request: Request,
  ...args: Args
) => Promise<NextResponse>;

function errorResponse(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status });
}

function singleForwardedValue(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed && !trimmed.includes(",") ? trimmed : "";
}

function externallyVisibleOrigin(request: Request): string | null {
  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url);
  } catch {
    return null;
  }

  const forwardedProto = singleForwardedValue(
    request.headers.get("x-forwarded-proto")
  );
  const forwardedHost = singleForwardedValue(
    request.headers.get("x-forwarded-host")
  );
  if (forwardedProto === "" || forwardedHost === "") return null;

  const protocol = forwardedProto ?? requestUrl.protocol.slice(0, -1);
  const host =
    forwardedHost ?? request.headers.get("host")?.trim() ?? requestUrl.host;
  if (
    (protocol !== "http" && protocol !== "https") ||
    !host ||
    /[\s,/@\\?#]/.test(host)
  ) {
    return null;
  }

  try {
    const visibleUrl = new URL(`${protocol}://${host}`);
    if (visibleUrl.host.toLowerCase() !== host.toLowerCase()) return null;
    return visibleUrl.origin;
  } catch {
    return null;
  }
}

function headerOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function hasSameOriginEvidence(request: Request): boolean {
  const visibleOrigin = externallyVisibleOrigin(request);
  if (!visibleOrigin) return false;

  const origin = request.headers.get("origin");
  if (origin !== null) {
    return headerOrigin(origin) === visibleOrigin;
  }

  if (request.headers.get("sec-fetch-site") !== "same-origin") return false;
  const referer = request.headers.get("referer");
  if (!referer) return false;

  try {
    return new URL(referer).origin === visibleOrigin;
  } catch {
    return false;
  }
}

function hasExpectedMediaType(
  request: Request,
  expectedMediaType: InternalActionMediaType
): boolean {
  const contentType = request.headers.get("content-type");
  if (!contentType) return false;
  return (
    contentType.split(";", 1)[0].trim().toLowerCase() === expectedMediaType
  );
}

export function internalAction<Args extends readonly unknown[]>(
  expectedMediaType: InternalActionMediaType | null,
  handler: InternalActionHandler<Args>
): InternalActionHandler<Args> {
  const instrumentedHandler = telemetry(handler);

  return async (request, ...args) => {
    if (!hasSameOriginEvidence(request)) {
      return errorResponse(403, "Forbidden");
    }
    if (
      expectedMediaType &&
      !hasExpectedMediaType(request, expectedMediaType)
    ) {
      return errorResponse(415, "Unsupported Media Type");
    }

    try {
      return await instrumentedHandler(request, ...args);
    } catch {
      return errorResponse(500, "Internal Server Error");
    }
  };
}
