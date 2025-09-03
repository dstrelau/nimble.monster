export function getBaseUrl(request?: Request): string {
  if (request) {
    const host = request.headers.get("host");
    if (host) {
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      return `${protocol}://${host}`;
    }
  }

  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}
