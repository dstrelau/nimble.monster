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
