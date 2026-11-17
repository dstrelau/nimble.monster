import Link from "next/link";
import { notFound } from "next/navigation";
import { FeaturedCollectionsCard } from "@/components/admin/FeaturedCollectionsCard";
import { isAdmin } from "@/lib/auth";
import {
  listFeaturedCollections,
  MONSTERY_MONDAY,
} from "@/lib/services/collections/queries";

export default async function MonsteryMondayAdminPage() {
  if (!(await isAdmin())) notFound();

  const collections = await listFeaturedCollections(MONSTERY_MONDAY);

  return (
    <div className="py-8 space-y-8">
      <Link href="/admin" className="text-primary hover:underline">
        Back to Admin
      </Link>
      <h1 className="text-3xl font-bold">Monstery Monday</h1>
      <p className="text-sm text-muted-foreground">
        Featured collections appear on{" "}
        <Link href="/monstery-monday" className="text-primary hover:underline">
          /monstery-monday
        </Link>{" "}
        while they are public.
      </p>
      <FeaturedCollectionsCard collections={collections} />
    </div>
  );
}
