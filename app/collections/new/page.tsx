import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { NewCollection } from "./NewCollectionClient";

export default async function NewCollectionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/create");
  }

  const myMonsters = await db.listAllMonstersForDiscordID(
    session.user.discordId
  );

  return <NewCollection myMonsters={myMonsters} />;
}
