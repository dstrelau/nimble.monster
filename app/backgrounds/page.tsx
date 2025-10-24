import { PaginatedBackgroundGrid } from "@/app/ui/background/PaginatedBackgroundGrid";

export default function BackgroundsPage() {
  return (
    <div className="container mx-auto">
      <PaginatedBackgroundGrid kind="backgrounds" />
    </div>
  );
}
