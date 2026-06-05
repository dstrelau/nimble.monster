import type { User } from "@/lib/types";
import { uuidToIdentifier } from "@/lib/utils/slug";

// JSON:API representation of a user.
// Only public profile info is exposed.
export const toJsonApiUser = (u: User) => {
  const id = uuidToIdentifier(u.id);
  return {
    type: "users",
    id,
    attributes: {
      username: u.username,
      displayName: u.displayName,
      imageUrl: u.imageUrl,
    },
    links: {
      self: `/api/users/${id}`,
    },
  };
};

type JsonApiUser = ReturnType<typeof toJsonApiUser>;

// Builds the deduplicated `included` user resources for a set of entities that
// each expose a `creator`. Used to satisfy `?include=creator` (JSON:API
// compound documents) on resources that have a creator relationship.
export const collectCreators = (
  entities: ReadonlyArray<{ creator: User }>
): JsonApiUser[] => {
  const byId = new Map<string, JsonApiUser>();
  for (const { creator } of entities) {
    const resource = toJsonApiUser(creator);
    if (!byId.has(resource.id)) {
      byId.set(resource.id, resource);
    }
  }
  return [...byId.values()];
};
