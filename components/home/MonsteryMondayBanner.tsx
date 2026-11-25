import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { InkArt } from "@/components/home/InkArt";
import { Button } from "@/components/ui/button";
import { getCollectionUrl } from "@/lib/utils/url";

export const MONSTERY_MONDAY_BANNER_WEEK = 100;

interface MonsteryMondayBannerProps {
  /** The week's collection, or null until it is posted. */
  week: { id: string; name: string } | null;
  monsters: number;
  items: number;
  creators: number;
}

// "Over 590" reads as a milestone; exact counts change every week.
function roundDown(value: number) {
  return (Math.floor(value / 10) * 10).toLocaleString("en-US");
}

export function MonsteryMondayBanner({
  week,
  monsters,
  items,
  creators,
}: MonsteryMondayBannerProps) {
  return (
    <section
      aria-labelledby="monstery-monday-banner-heading"
      className="grid items-center gap-x-6 gap-y-4 rounded-lg border border-primary/30 bg-primary/10 px-5 py-4 sm:grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto]"
    >
      <InkArt name="floating-eye" decorative className="hidden h-20 sm:block" />
      <div>
        <p className="font-condensed text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Monstery Monday
        </p>
        <h2
          id="monstery-monday-banner-heading"
          className="font-slab text-2xl font-bold text-card-foreground md:text-3xl"
        >
          {MONSTERY_MONDAY_BANNER_WEEK} weeks of community creations
        </h2>
        {monsters >= 10 && (
          <p className="mt-1">
            Over {roundDown(monsters)} themed monsters, {roundDown(items)}{" "}
            items, and more from {roundDown(creators)} creators.
          </p>
        )}
      </div>
      <Button size="lg" asChild className="sm:col-start-2 md:col-start-auto">
        <Link href={week ? getCollectionUrl(week) : "/monstery-monday"}>
          Explore
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}
