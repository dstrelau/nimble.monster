import type { CustomRule } from "@/lib/db/custom-rule";
import { uuidToIdentifier } from "@/lib/utils/slug";

export const toJsonApiCustomRule = (rule: CustomRule) => {
  const id = uuidToIdentifier(rule.id);
  return {
    type: "custom-rules",
    id,
    attributes: {
      name: rule.name,
      content: rule.content,
      sections: rule.links.map((link) => ({
        slug: link.sectionSlug,
        relation: link.relation,
      })),
    },
    relationships: {
      creator: {
        data: {
          type: "users",
          id: uuidToIdentifier(rule.creator.id),
        },
      },
    },
    links: {
      self: `/api/custom-rules/${id}`,
    },
  };
};
