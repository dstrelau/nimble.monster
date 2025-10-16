import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as monstersRepo from "@/lib/services/monsters/repository";
import { NewCollection } from "./NewCollectionClient";

export default async function NewCollectionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/create");
  }

  const myMonsters = await monstersRepo.listAllMonstersForDiscordID(
    session.user.discordId
  );

  return <NewCollection myMonsters={myMonsters} />;
}
