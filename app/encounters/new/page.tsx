import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEncounter } from "@/lib/db";
import type { Encounter } from "@/lib/types";
import { deslugify } from "@/lib/utils/slug";
import { NewEncounter } from "./NewEncounterClient";

export default async function NewEncounterPage({
  searchParams,
}: {
  searchParams: Promise<{ remix?: string | string[] }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/encounters/new");
  }

  const { remix } = await searchParams;
  let initialEncounter: Encounter | undefined;
  if (remix) {
    const id = typeof remix === "string" ? deslugify(remix) : null;
    const source = id ? await getEncounter(id, session.user.discordId) : null;
    if (!source) notFound();

    initialEncounter = {
      id: "",
      creator: session.user,
      name: source.name,
      description: source.description,
      visibility: source.visibility,
      heroCount: source.heroCount,
      heroLevel: source.heroLevel,
      monsters: source.monsters.filter(
        ({ monster }) =>
          monster.visibility === "public" ||
          monster.creator.discordId === session.user.discordId
      ),
    };
  }

  return (
    <NewEncounter
      key={typeof remix === "string" ? remix : "new"}
      initialEncounter={initialEncounter}
    />
  );
}
