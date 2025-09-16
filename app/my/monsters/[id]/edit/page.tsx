import { unauthorized } from "next/navigation";
import BuildMonster from "@/app/monsters/BuildMonsterView";
import { auth } from "@/lib/auth";
import { findMonsterWithCreatorDiscordId } from "@/lib/db/monster";

export default async function EditMonsterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const monster = await findMonsterWithCreatorDiscordId(
    id,
    session?.user.discordId
  );

  if (!monster) {
    return <div>Monster not found</div>;
  }

  return <BuildMonster existingMonster={monster} />;
}
