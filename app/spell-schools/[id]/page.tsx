import { notFound } from "next/navigation";
import { Card } from "@/app/ui/school/Card";
import { SchoolActions } from "@/app/ui/school/SchoolActions";
import { AddToCollectionDialog } from "@/components/AddToCollectionDialog";
import { MonsterCollections } from "@/components/MonsterCollections";
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
    <div className="container mx-auto">
      <div className="flex justify-end items-start gap-2 mb-6">
        {isOwner && <SchoolActions spellSchool={spellSchool} />}
        {session?.user && (
          <AddToCollectionDialog
            type="spellSchool"
            spellSchoolId={spellSchool.id}
          />
        )}
      </div>

      <div className="max-w-xl mx-auto flex flex-col items-center gap-12">
        <Card spellSchool={spellSchool} link={false} />
        <MonsterCollections collections={collections} />
      </div>
    </div>
  );
}
