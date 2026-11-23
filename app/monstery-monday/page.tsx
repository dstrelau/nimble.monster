import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { publicCollectionsInfiniteQueryOptions } from "@/app/collections/actions";
import { CollectionPlateCard } from "@/components/collection/CollectionPlateCard";
import { CollectionsListView } from "@/components/collection/CollectionsListView";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { getQueryClient } from "@/lib/queryClient";
import {
  getMonsteryMondayOverview,
  MONSTERY_MONDAY,
} from "@/lib/services/collections/queries";
import { publicCollectionPage } from "@/lib/services/collections/service";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";
import { getUserUrl } from "@/lib/utils/url";

// Shared by the page intro and the metadata description so they stay in sync.
const INTRO =
  "A weekly themed design challenge for the Nimble homebrew community.";
const CURATOR = "SanityWithIn";
const PAGE_SIZE = 18;

export const metadata: Metadata = {
  title: `Monstery Monday - ${SITE_NAME}`,
  description: `${INTRO} Curated by ${CURATOR}.`,
};

// Safari still needs the -webkit- mask properties, so set both like InkArt.
function eyeMask(layer: "ink" | "fill"): CSSProperties {
  const url = `url(/monstery-monday/floating-eye-${layer}.webp)`;
  return {
    maskImage: url,
    WebkitMaskImage: url,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  };
}

export default async function MonsteryMondayPage() {
  const params = { featuredCollection: MONSTERY_MONDAY, limit: PAGE_SIZE };
  const queryClient = getQueryClient();
  const [overview] = await Promise.all([
    getMonsteryMondayOverview(),
    queryClient.prefetchInfiniteQuery({
      ...publicCollectionsInfiniteQueryOptions(params),
      queryFn: ({ pageParam }) =>
        publicCollectionPage({ ...params, pageParam }),
    }),
  ]);
  const { counts } = overview;
  const stats = [
    { singular: "Monster", plural: "Monsters", value: counts.monsters },
    { singular: "Hazard", plural: "Hazards", value: counts.hazards },
    { singular: "Item", plural: "Items", value: counts.items },
    { singular: "Companion", plural: "Companions", value: counts.companions },
    { singular: "Ancestry", plural: "Ancestries", value: counts.ancestries },
    {
      singular: "Background",
      plural: "Backgrounds",
      value: counts.backgrounds,
    },
    { singular: "Class", plural: "Classes", value: counts.classes },
    { singular: "Subclass", plural: "Subclasses", value: counts.subclasses },
    {
      singular: "Spell School",
      plural: "Spell Schools",
      value: counts.spellSchools,
    },
    { singular: "Rule", plural: "Rules", value: counts.rules },
    {
      singular: "Reference Table",
      plural: "Reference Tables",
      value: counts.randomTables,
    },
  ];
  const shownStats = stats
    .filter(({ value }) => value > 0)
    .map(({ singular, plural, value }) => ({
      label: value === 1 ? singular : plural,
      value,
    }));

  return (
    <div className="space-y-9">
      <section
        aria-labelledby="monday-title"
        className="mx-auto grid max-w-5xl items-start gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[3fr_2fr]"
      >
        <div>
          <h1
            id="monday-title"
            className="-mt-1 mb-4 font-slab text-4xl leading-none font-bold tracking-tight text-card-foreground lg:text-5xl"
          >
            Monstery Monday
          </h1>
          <p className="max-w-md">
            {INTRO} Curated by{" "}
            <Link
              href="/u/sanitywithin"
              className="underline underline-offset-4"
            >
              {CURATOR}
            </Link>
            .
          </p>
          <dl
            aria-label="Full archive totals"
            // Three per row whenever they wrap; one row on wide screens if
            // they fit.
            className={cn(
              "my-5 grid grid-cols-3 gap-x-7 gap-y-3 border-y py-3",
              shownStats.length <= 6 && "lg:flex"
            )}
          >
            {shownStats.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col-reverse justify-end gap-0.5"
              >
                <dt className="text-sm">{label}</dt>
                <dd className="font-slab text-4xl font-bold tracking-tight text-primary tabular-nums">
                  {value.toLocaleString("en-US")}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex max-w-md items-center gap-6">
            <div
              aria-hidden="true"
              className="relative aspect-[781/1000] w-24 shrink-0 sm:w-28"
            >
              <div
                className="absolute inset-0 bg-[#fffdf8]"
                style={eyeMask("fill")}
              />
              <div
                className="absolute inset-0 bg-[#241f18]"
                style={eyeMask("ink")}
              />
            </div>
            <p>
              Themes posted weekly in the Nimble community Discord.{" "}
              <a
                href="https://discord.gg/2etKN3aGfM"
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap underline underline-offset-4"
              >
                Join the challenge
              </a>
              .
            </p>
          </div>
        </div>
        {overview.latest && (
          <section aria-labelledby="latest-title" className="md:self-center">
            <h2 id="latest-title" className="sr-only">
              Latest collection
            </h2>
            <CollectionPlateCard collection={overview.latest} />
          </section>
        )}
      </section>
      {overview.creators.length > 0 && (
        <section
          aria-labelledby="creators-title"
          className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y py-4"
        >
          <h2
            id="creators-title"
            className="font-slab text-lg font-bold whitespace-nowrap"
          >
            Contributions from{" "}
            <span className="text-primary">
              {overview.creators.length.toLocaleString("en-US")}
            </span>{" "}
            creators
          </h2>
          <ul className="flex flex-wrap gap-y-1.5 pl-2">
            {overview.creators.map((creator) => (
              <li key={creator.id} className="-ml-2">
                <Link
                  href={getUserUrl(creator)}
                  title={creator.displayName}
                  className="block rounded-full"
                >
                  <UserAvatar
                    user={creator}
                    size={34}
                    className="bg-muted ring-2 ring-background"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section
        id="archive"
        aria-labelledby="archive-title"
        className="scroll-mt-6 space-y-4"
      >
        <h2 id="archive-title" className="sr-only">
          Past collections
        </h2>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CollectionsListView
            featuredCollection={MONSTERY_MONDAY}
            cardVariant="plate"
            limit={PAGE_SIZE}
            endMessage={
              <p className="text-center text-muted-foreground">
                Early pre-Nexus Monstery Monday content can be found in the{" "}
                <a
                  href="https://drive.google.com/drive/folders/1bTFxGfeYQIw8UlW-trwGuTdZHXCc1RXU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  Google Drive
                </a>
                .
              </p>
            }
          />
        </HydrationBoundary>
      </section>
    </div>
  );
}
