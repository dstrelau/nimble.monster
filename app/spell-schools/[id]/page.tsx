import { notFound } from "next/navigation";
import { AddToCollectionDialog } from "@/components/collection/AddToCollectionDialog";
import { DetailActionBar } from "@/components/DetailActionBar";
import { HydratedEntityDetail } from "@/components/HydratedEntityDetail";
import { MonsterCollections } from "@/components/monster/MonsterCollections";
import { ReportEntityDialog } from "@/components/ReportEntityDialog";
import { Card } from "@/components/school/Card";
import { SchoolActions } from "@/components/school/SchoolActions";
import { auth } from "@/lib/auth";
import { findSpellSchool, findSpellSchoolCollections } from "@/lib/db";
import { deslugify } from "@/lib/utils/slug";

interface SchoolPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) return notFound();
  const session = await auth();

  const spellSchool = await findSpellSchool(uid);
  if (!spellSchool) {
    notFound();
  }
  const isOwner = session?.user?.id === spellSchool.creator.id;
  if (!isOwner && spellSchool.visibility !== "public") {
    notFound();
  }

  const collections = await findSpellSchoolCollections(uid);

  return (
    <HydratedEntityDetail
      authenticated={Boolean(session?.user?.id)}
      entityType="spellSchool"
      entityId={spellSchool.id}
      viewerDiscordId={session?.user?.discordId}
    >
      <div>
        <DetailActionBar>
          {isOwner && <SchoolActions spellSchool={spellSchool} />}
          {session?.user && (
            <AddToCollectionDialog
              type="spellSchool"
              spellSchoolId={spellSchool.id}
            />
          )}
          {session?.user && (
            <ReportEntityDialog
              entityType="spellSchool"
              entityId={spellSchool.id}
              entityLabel="Spell School"
            />
          )}
        </DetailActionBar>

        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-12">
          <Card spellSchool={spellSchool} link={false} />
          <MonsterCollections collections={collections} />
        </div>
      </div>
    </HydratedEntityDetail>
  );
}
