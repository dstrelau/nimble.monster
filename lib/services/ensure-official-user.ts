import { getDatabase } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";

export async function ensureOfficialUser(): Promise<void> {
  const db = await getDatabase();
  await db
    .insert(users)
    .values({
      id: OFFICIAL_USER_ID,
      username: "nimble-co",
      displayName: "Nimble Co.",
      imageUrl: "/images/nimble-n.png",
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username: "nimble-co",
        displayName: "Nimble Co.",
        imageUrl: "/images/nimble-n.png",
      },
    });
}
