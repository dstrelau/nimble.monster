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
      sectionSlugs: rule.sectionSlugs,
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
