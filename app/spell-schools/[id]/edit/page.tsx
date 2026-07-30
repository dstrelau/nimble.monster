import { notFound } from "next/navigation";
import BuildSchoolView from "@/app/spell-schools/BuildSchoolView";
import { HydratedBuilderData } from "@/components/HydratedBuilderData";
import { auth } from "@/lib/auth";
import { findSpellSchoolWithCreatorDiscordId } from "@/lib/db/school";

interface EditSchoolPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSchoolPage({ params }: EditSchoolPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.discordId) {
    notFound();
  }

  const spellSchool = await findSpellSchoolWithCreatorDiscordId(
    id,
    session.user.discordId
  );

  if (!spellSchool) {
    notFound();
  }

  return (
    <HydratedBuilderData>
      <BuildSchoolView existingSchool={spellSchool} />
    </HydratedBuilderData>
  );
}
