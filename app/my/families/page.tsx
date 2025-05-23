import * as db from "@/lib/db";

import { FamilyCard } from "./FamilyCard";
import { NewFamilyForm } from "./NewFamilyForm";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function MyFamiliesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const families = await db.getUserFamilies(session.user.id);

  return (
    <div className="space-y-6">
      <NewFamilyForm />

      {families.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Families allow associating one or more abilities with a group of
            related monsters.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 items-start md:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
        </div>
      )}
    </div>
  );
}
