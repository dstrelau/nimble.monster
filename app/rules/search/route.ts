import { searchPublicCustomRules } from "@/lib/db/custom-rule";
import { searchRules } from "@/lib/rules/search";
import { getCustomRuleUrl } from "@/lib/utils/url";

const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 8;

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().slice(0, MAX_QUERY_LENGTH);
  const includeHomebrew = searchParams.get("includeHomebrew") === "true";
  const custom =
    query && includeHomebrew ? await searchPublicCustomRules(query, 2) : [];
  const official = query ? searchRules(query, MAX_RESULTS - custom.length) : [];
  const results = [
    ...official,
    ...custom.map((rule) => ({
      slug: rule.id,
      title: rule.name,
      category: "custom",
      href: getCustomRuleUrl(rule),
      customRule: true,
    })),
  ];
  return Response.json({ results });
}
