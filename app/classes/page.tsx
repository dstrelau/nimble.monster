import type { Metadata } from "next";
import { ClassMiniCard } from "@/app/ui/class/ClassMiniCard";
import { listPublicClasses } from "@/lib/db";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = {
  title: `Classes | ${SITE_NAME}`,
  description: "Browse all public classes",
};

export default async function ClassesPage() {
  const classes = await listPublicClasses();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classEntity) => (
          <ClassMiniCard key={classEntity.id} classEntity={classEntity} />
        ))}
      </div>
      {classes.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No public classes found.
        </p>
      )}
    </div>
  );
}
