import { notFound } from "next/navigation";
import { getDatabase } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { DevLoginList } from "./DevLoginList";

export default async function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const db = getDatabase();
  const allUsers = await db
    .select({
      discordId: users.discordId,
      username: users.username,
      displayName: users.displayName,
    })
    .from(users);

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="mb-4 font-bold text-xl">Dev Login</h1>
      <DevLoginList users={allUsers} />
    </div>
  );
}
