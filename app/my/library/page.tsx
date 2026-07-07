import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { MY_LIBRARY_ITEMS } from "@/lib/types/entity-links";

export default async function MyLibraryPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const counts = await db.getMyLibraryCounts(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Library</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {MY_LIBRARY_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded-md border bg-card p-3 text-card-foreground hover:bg-accent transition-colors"
          >
            <item.icon className="size-5 shrink-0" />
            <span className="flex-1">{item.label}</span>
            <span className="text-sm text-muted-foreground">
              {counts[item.key]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
