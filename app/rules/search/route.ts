import { searchRules } from "@/lib/rules/search";

const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 8;

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams
    .get("q")
    ?.trim()
    .slice(0, MAX_QUERY_LENGTH);
  const results = query ? searchRules(query, MAX_RESULTS) : [];
  return Response.json({ results });
}
