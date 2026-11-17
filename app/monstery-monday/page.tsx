import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { publicCollectionsInfiniteQueryOptions } from "@/app/collections/actions";
import { CollectionCard } from "@/components/collection/CollectionCard";
import { CollectionsListView } from "@/components/collection/CollectionsListView";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { getQueryClient } from "@/lib/queryClient";
import {
  getMonsteryMondayOverview,
  MONSTERY_MONDAY,
} from "@/lib/services/collections/queries";
import { publicCollectionPage } from "@/lib/services/collections/service";
import { SITE_NAME } from "@/lib/utils/branding";
import { getUserUrl } from "@/lib/utils/url";

export const metadata: Metadata = {
  title: `Monstery Monday - ${SITE_NAME}`,
  description:
    "Explore the community’s weekly Nimble design challenges and collections.",
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
  const params = { featuredCollection: MONSTERY_MONDAY };
  const queryClient = getQueryClient();
  const [overview] = await Promise.all([
    getMonsteryMondayOverview(),
    queryClient.prefetchInfiniteQuery({
      ...publicCollectionsInfiniteQueryOptions(params),
      queryFn: ({ pageParam }) =>
        publicCollectionPage({ ...params, pageParam }),
    }),
  ]);
  const stats = [
    { label: "Monsters", value: overview.monsters },
    { label: "Creators", value: overview.creators.length },
    { label: "Collections", value: overview.collections },
  ];

  return (
    <div className="space-y-9">
      <section
        aria-labelledby="monday-title"
        className="grid items-start gap-8 md:grid-cols-2 md:gap-10"
      >
        <div>
          <h1
            id="monday-title"
            className="-mt-1 mb-4 font-slab text-4xl leading-none font-bold tracking-tight text-card-foreground lg:text-5xl"
          >
            Monstery Monday
          </h1>
          <p className="max-w-md">
            A weekly themed design challenge for the Nimble homebrew community.
            Curated by{" "}
            <Link
              href="/u/sanitywithin"
              className="underline underline-offset-4"
            >
              SanityWithIn
            </Link>
            .
          </p>
          <dl
            aria-label="Full archive totals"
            className="my-7 grid max-w-md grid-cols-3 gap-3 border-y py-5"
          >
            {stats.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col-reverse justify-end gap-1.5"
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
          <section aria-labelledby="latest-title">
            <h2 id="latest-title" className="sr-only">
              Latest collection
            </h2>
            <CollectionCard
              collection={overview.latest}
              showDescription={false}
            />
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
            Made by{" "}
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
          <CollectionsListView featuredCollection={MONSTERY_MONDAY} />
        </HydrationBoundary>
      </section>
    </div>
  );
}
