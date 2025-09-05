import { unauthorized } from "next/navigation";
import BuildCompanionView from "@/app/companions/BuildCompanionView";
import { auth } from "@/lib/auth";
import { findCompanionWithCreatorDiscordId } from "@/lib/db/companion";

export default async function EditCompanionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const companion = await findCompanionWithCreatorDiscordId(
    id,
    session?.user.id
  );

  if (!companion) {
    return <div>Companion not found</div>;
  }

  return <BuildCompanionView existingCompanion={companion} />;
}
