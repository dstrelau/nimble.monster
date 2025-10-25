import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card as AncestryCard } from "@/app/ui/ancestry/Card";
import { Card as BackgroundCard } from "@/app/ui/background/Card";
import { Card as CompanionCard } from "@/app/ui/companion/Card";
import { Card as ItemCard } from "@/app/ui/item/Card";
import { Card as MonsterCard } from "@/app/ui/monster/Card";
import { Card as SchoolCard } from "@/app/ui/school/Card";
import { getAwardBySlug, getEntitiesForAward } from "@/lib/db/award";
import { SITE_NAME } from "@/lib/utils/branding";
import { ExternalLink } from "lucide-react";
import { SubclassMiniCard } from "@/app/ui/subclass/SubclassMiniCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const award = await getAwardBySlug(slug);

  if (!award) return {};

  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: award.name,
    description: `${award.name} - Award winners | ${SITE_NAME}`,
  };
}

export default async function AwardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const award = await getAwardBySlug(slug);
  if (!award) return notFound();

  const entities = await getEntitiesForAward(award.id);

  const totalCount =
    entities.monsters.length +
    entities.items.length +
    entities.companions.length +
    entities.subclasses.length +
    entities.schools.length +
    entities.ancestries.length +
    entities.backgrounds.length;

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex flex-col gap-4">
          <h2 className="flex gap-2 items-baseline text-2xl font-bold font-slab">{award.name}
          <Link
            href={award.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-foreground hover:text-flame"
          >
            <ExternalLink className="size-6"/>
          </Link>
          </h2>
          <p>{award.description}</p>
        </div>

      {totalCount === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No award recipients (yet)</p>
        </div>
      ) : (
        <div className="space-y-12">
          {entities.monsters.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">
                Monsters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.monsters.map((monster) => (
                  <div key={monster.id} className="w-full max-w-sm mx-auto">
                    <MonsterCard monster={monster} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {entities.items.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">
                Items
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.items.map((item) => (
                  <div key={item.id} className="w-full max-w-sm mx-auto">
                    <ItemCard item={item} creator={item.creator} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {entities.companions.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">
                Companions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.companions.map((companion) => (
                  <div key={companion.id} className="w-full max-w-sm mx-auto">
                    <CompanionCard
                      companion={companion}
                      creator={companion.creator}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {entities.subclasses.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">
                Subclasses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.subclasses.map((subclass) => (
                  <div key={subclass.id} className="w-full max-w-sm mx-auto">
                    <SubclassMiniCard subclass={subclass} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {entities.schools.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">
                Spell Schools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.schools.map((school) => (
                  <div key={school.id} className="w-full max-w-sm mx-auto">
                    <SchoolCard spellSchool={school} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {entities.ancestries.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">
                Ancestries
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.ancestries.map((ancestry) => (
                  <div key={ancestry.id} className="w-full max-w-sm mx-auto">
                    <AncestryCard hideDescription ancestry={ancestry} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {entities.backgrounds.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">
                Backgrounds
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entities.backgrounds.map((background) => (
                  <div key={background.id} className="w-full max-w-sm mx-auto">
                    <BackgroundCard background={background} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
