import { PaginatedAncestryGrid } from "@/app/ui/ancestry/PaginatedAncestryGrid";

export default function AncestriesPage() {
  return (
    <div className="container mx-auto">
      <PaginatedAncestryGrid kind="ancestries" />
    </div>
  );
}
