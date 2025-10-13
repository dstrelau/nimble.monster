import { notFound } from "next/navigation";
import BuildSchoolView from "@/app/spell-schools/BuildSchoolView";
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

  return <BuildSchoolView existingSchool={spellSchool} />;
}
