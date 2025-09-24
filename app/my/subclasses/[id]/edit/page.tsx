import { unauthorized } from "next/navigation";
import BuildSubclass from "@/app/subclasses/BuildSubclassView";
import { auth } from "@/lib/auth";
import { findSubclassWithCreatorDiscordId } from "@/lib/db/subclass";

export default async function EditSubclassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const subclass = await findSubclassWithCreatorDiscordId(
    id,
    session?.user.discordId
  );

  if (!subclass) {
    return <div>Subclass not found</div>;
  }

  return <BuildSubclass subclass={subclass} />;
}
