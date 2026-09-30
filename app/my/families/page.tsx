import { notFound } from "next/navigation";
import { FamilyCard } from "@/components/family/FamilyCard";
import { CreateEmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { getUserFamiliesWithMonsters } from "@/lib/db";

export default async function MyFamiliesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const families = await getUserFamiliesWithMonsters(session.user.discordId);

  return (
    <div className="space-y-6">
      {families.length === 0 ? (
        <CreateEmptyState href="/families/new" entityName="Family" />
      ) : (
        <div className="grid gap-8 items-start md:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              monsters={family.monsters}
              showEditDeleteButtons
            />
          ))}
        </div>
      )}
    </div>
  );
}
