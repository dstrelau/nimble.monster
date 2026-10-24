import { Library } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameIcon } from "@/components/icons/GameIcon";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { MonsterImage } from "@/components/monster/MonsterImage";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { auth } from "@/lib/auth";
import { listMyLibraryEntries } from "@/lib/db/my-library";
import {
  MY_LIBRARY_ITEMS,
  MY_LIBRARY_PRIVATE_ITEMS,
} from "@/lib/types/entity-links";
import { SITE_NAME } from "@/lib/utils/branding";

export const metadata: Metadata = { title: `My Library - ${SITE_NAME}` };

const SECTIONS = [...MY_LIBRARY_ITEMS, ...MY_LIBRARY_PRIVATE_ITEMS];

const createdDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default async function MyLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const entries = await listMyLibraryEntries(session.user.id, { query });

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader icon={Library} title="My Library" />
      {entries.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          {query
            ? `Nothing in your library matches “${query}”.`
            : "Nothing in your library yet."}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card text-card-foreground">
          {entries.map((entry) => {
            const section = SECTIONS.find((item) => item.key === entry.key);
            const Icon = section?.icon ?? Library;
            return (
              <li key={`${entry.key}:${entry.id}`}>
                <Link
                  href={entry.href}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {entry.paperforgeId || entry.customArtwork ? (
                    <MonsterImage
                      paperforgeId={entry.paperforgeId}
                      customArtwork={entry.customArtwork}
                      size={40}
                      className="size-9 shrink-0"
                      alt=""
                    />
                  ) : entry.imageIcon ? (
                    <span className="flex size-9 shrink-0 items-center justify-center">
                      <GameIcon
                        iconId={entry.imageIcon}
                        className="size-8 fill-muted-foreground group-hover:fill-primary"
                      />
                    </span>
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center">
                      <Icon className="size-5 text-muted-foreground group-hover:text-primary" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium group-hover:underline">
                      {entry.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {section?.label}
                      {entry.createdAt && (
                        <>
                          {" · "}
                          <time dateTime={entry.createdAt}>
                            {createdDate.format(new Date(entry.createdAt))}
                          </time>
                        </>
                      )}
                    </span>
                  </span>
                  {entry.visibility && (
                    <VisibilityBadge
                      visibility={entry.visibility}
                      className="shrink-0"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
