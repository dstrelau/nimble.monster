import { LibraryBig, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MyLibraryPage() {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-xl border bg-card px-6 py-12 text-center shadow-sm">
      <div className="max-w-lg">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-accent text-primary">
          <LibraryBig className="size-7" />
        </div>
        <h1 className="font-slab text-2xl font-bold">Build your next idea</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a section from the library navigation to revisit your work, or
          start creating something new for your table.
        </p>
        <Button asChild className="mt-6">
          <Link href="/create">
            <Plus />
            Create something
          </Link>
        </Button>
      </div>
    </div>
  );
}
