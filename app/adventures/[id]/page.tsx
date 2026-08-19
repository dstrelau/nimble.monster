import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { AdventureView } from "@/app/adventures/AdventureView";
import {
  AdventureOutline,
  type AdventureOutlineNode,
} from "@/components/adventure/AdventureOutline";
import { EntityReactions } from "@/components/EntityReactions";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { findAdventure } from "@/lib/db/adventures";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify, slugify } from "@/lib/utils/slug";
import { getAdventureEditUrl, getAdventureUrl } from "@/lib/utils/url";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getAdventure = cache(findAdventure);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) return {};
  const [adventure, session] = await Promise.all([getAdventure(uid), auth()]);
  if (
    !adventure ||
    (adventure.visibility === "private" &&
      adventure.creator.id !== session?.user?.id)
  ) {
    return {};
  }
  return {
    title: `${adventure.name} - ${SITE_NAME}`,
    description: adventure.summary || adventure.tagline,
  };
}

export default async function AdventurePage({ params }: PageProps) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) notFound();

  const [adventure, session] = await Promise.all([getAdventure(uid), auth()]);
  if (!adventure) notFound();
  const isOwner = adventure.creator.id === session?.user?.id;
  if (!isOwner && adventure.visibility !== "public") notFound();
  if (id !== slugify(adventure)) {
    permanentRedirect(getAdventureUrl(adventure));
  }
  const outlineNodes: AdventureOutlineNode[] = adventure.nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId,
    orderIndex: node.orderIndex,
    kind: node.kind,
    label:
      node.title ||
      node.encounter?.name ||
      node.monsters[0]?.name ||
      node.items[0]?.name ||
      "Untitled content",
  }));

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <AdventureOutline
          nodes={outlineNodes}
          className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-3"
        />
      </aside>
      <div className="min-w-0">
        <div className="mb-6 flex justify-end gap-2">
          <EntityReactions
            entityType="adventure"
            entityId={adventure.id}
            showLabel
          />
          {isOwner && (
            <Button variant="outline" size="sm" asChild>
              <Link href={getAdventureEditUrl(adventure)}>
                <Pencil />
                Edit
              </Link>
            </Button>
          )}
        </div>
        <AdventureView adventure={adventure} />
      </div>
    </main>
  );
}
