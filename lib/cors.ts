export function addCorsHeaders(headers: Headers, request: Request): void {
  const requestOrigin = request.headers.get("Origin");

  if (requestOrigin != undefined && requestOrigin !== "*") {
    headers.set("Access-Control-Allow-Origin", requestOrigin);
    headers.set("Access-Control-Allow-Credentials", "true");
  } else {
    headers.set("Access-Control-Allow-Origin", "*");
  }

  headers.set("Access-Control-Allow-Methods", "GET");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
}
