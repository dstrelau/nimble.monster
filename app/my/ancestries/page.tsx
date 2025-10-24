import { notFound } from "next/navigation";
import { PaginatedAncestryGrid } from "@/app/ui/ancestry/PaginatedAncestryGrid";
import { auth } from "@/lib/auth";

export default async function MyAncestriesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <PaginatedAncestryGrid kind="my-ancestries" />
    </div>
  );
}
