import { ArrowRight, BookOpen, Dices, FolderOpen, Table2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ClassMiniCard } from "@/components/class/ClassMiniCard";
import { GlobalSearchTrigger } from "@/components/layout/GlobalSearchDialog";
import { MonsterCardWithOverflow } from "@/components/monster/MonsterCardWithOverflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findOfficialClassesByNames } from "@/lib/services/classes/repository";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { monstersService } from "@/lib/services/monsters/service";
import { cn } from "@/lib/utils";

const PREP_GROUPS = [
  {
    title: "Build the scene",
    description:
      "Locations, situations, and tools to bring your world to life.",
    links: [
      { label: "Adventures", href: "/adventures" },
      { label: "Encounters", href: "/encounters" },
      { label: "Reference tables", href: "/tables" },
    ],
  },
  {
    title: "Surprise the party",
    description:
      "Creatures, challenges, and treasures to keep things interesting.",
    links: [
      { label: "Monsters", href: "/monsters" },
      { label: "Hazards", href: "/hazards" },
      { label: "Items", href: "/items" },
      { label: "Companions", href: "/companions" },
    ],
  },
  {
    title: "Expand their possibilities",
    description: "New options for every kind of hero.",
    links: [
      { label: "Ancestries", href: "/ancestries" },
      { label: "Backgrounds", href: "/backgrounds" },
      { label: "Classes", href: "/classes" },
      { label: "Subclasses", href: "/subclasses" },
      { label: "Spell schools", href: "/spell-schools" },
    ],
  },
];

const SHORTCUTS = [
  { label: "Rules reference", href: "/rules", icon: BookOpen },
  { label: "Reference tables", href: "/tables", icon: Table2 },
  { label: "Dice roller", href: "/roll", icon: Dices },
  { label: "Collections", href: "/collections", icon: FolderOpen },
];

interface PlaceholderArtProps {
  region: "hero" | "prep" | "contribution";
  className?: string;
}

// Temporary crops of the approved concept, not commissioned site artwork.
// Large FPO overlays are burned into every asset so the art cannot render unmarked.
function PlaceholderArt({ region, className }: PlaceholderArtProps) {
  return (
    <div
      role="img"
      aria-label={`${region} artwork: FPO temporary AI-generated placeholder, to be replaced by a human commission`}
      className={cn("relative isolate overflow-hidden rounded-sm", className)}
    >
      <Image
        src={`/field-guide-fpo/${region}.webp`}
        alt=""
        fill
        loading={region === "hero" ? "eager" : "lazy"}
        sizes={region === "hero" ? "(min-width: 768px) 50vw, 100vw" : "320px"}
        className="object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 bg-black px-2 py-1 text-center font-sans text-xs font-bold text-white"
      >
        PLACEHOLDER · HUMAN ART TO COME
      </span>
    </div>
  );
}

export async function FieldGuideHome() {
  const [officialMonsters, officialClasses, homebrewMonsters] =
    await Promise.all([
      monstersService.paginatePublicMonsters({
        creatorId: OFFICIAL_USER_ID,
        sort: "name",
        limit: 1,
      }),
      findOfficialClassesByNames(["Berserker"]),
      monstersService.paginatePublicMonsters({
        excludeCreatorId: OFFICIAL_USER_ID,
        sort: "-createdAt",
        limit: 1,
      }),
    ]);
  const officialClass = officialClasses.get("Berserker");

  return (
    <div className="space-y-12 pb-4 md:space-y-16">
      <section
        aria-labelledby="field-guide-heading"
        className="grid items-center gap-8 md:grid-cols-2 md:gap-4"
      >
        <div className="relative z-10 space-y-6 py-4 md:py-10">
          <p className="font-condensed text-sm font-bold uppercase tracking-[0.2em] text-primary">
            A field guide to Nimble
          </p>
          <h1
            id="field-guide-heading"
            className="max-w-xl font-slab text-5xl font-black leading-[1.05] tracking-tight text-card-foreground lg:text-7xl"
          >
            Your next session starts here.
          </h1>
          <p className="max-w-md text-lg md:text-xl">
            Official reference. Community imagination.
            <br />
            More to bring to your Nimble table.
          </p>
          <GlobalSearchTrigger />
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="#discover">
                Explore homebrew <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/rules">Open rules reference</Link>
            </Button>
          </div>
        </div>
        <PlaceholderArt region="hero" className="h-80 md:h-[530px]" />
      </section>

      <section aria-labelledby="prep-heading" className="space-y-7">
        <h2
          id="prep-heading"
          className="font-slab text-3xl font-bold tracking-tight md:text-4xl"
        >
          Find something for your next session.
        </h2>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          <PlaceholderArt region="prep" className="h-56 self-center" />
          {PREP_GROUPS.map((group) => (
            <div key={group.title} className="border-l border-border pl-6">
              <h3 className="font-slab text-xl font-bold text-card-foreground">
                {group.title}
              </h3>
              <p className="mb-4 mt-2 text-sm">{group.description}</p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-8 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {link.label}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section
        id="discover"
        aria-labelledby="discover-heading"
        className="scroll-mt-6 space-y-6"
      >
        <div>
          <h2
            id="discover-heading"
            className="font-slab text-3xl font-bold tracking-tight md:text-4xl"
          >
            Start with the familiar. Find something new.
          </h2>
          <p className="mt-2">
            From the official books to homebrew made for the table.
          </p>
        </div>
        <div className="grid items-start gap-6 md:grid-cols-3">
          <div className="min-w-0 space-y-3">
            <Badge variant="outline">Official · Monster</Badge>
            {officialMonsters.data.map((monster) => (
              <MonsterCardWithOverflow key={monster.id} monster={monster} />
            ))}
            {!officialMonsters.data.length && (
              <p>No official monsters available yet.</p>
            )}
            <Link
              href="/monsters"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Browse monsters{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="min-w-0 space-y-3">
            <Badge variant="outline">Official · Class</Badge>
            {officialClass?.visibility === "public" ? (
              <ClassMiniCard classEntity={officialClass} />
            ) : (
              <p>Explore the official character options.</p>
            )}
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Explore classes{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="min-w-0 space-y-3">
            <Badge variant="outline">Homebrew · Monster</Badge>
            {homebrewMonsters.data.map((monster) => (
              <MonsterCardWithOverflow key={monster.id} monster={monster} />
            ))}
            {!homebrewMonsters.data.length && (
              <p>
                The next creature could be yours. Share something from your
                table.
              </p>
            )}
            <Link
              href="/my/library"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Make something new{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <nav
        aria-label="At the table"
        className="flex flex-wrap items-center gap-4 border-y border-border py-5 md:justify-between"
      >
        <h2 className="w-full font-slab text-2xl font-bold md:w-auto">
          At the table
        </h2>
        {SHORTCUTS.map(({ label, href, icon: Icon }) => (
          <Button key={href} variant="ghost" asChild>
            <Link href={href}>
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </Button>
        ))}
      </nav>

      <section
        aria-labelledby="contribute-heading"
        className="grid items-center gap-6 overflow-hidden rounded-lg border border-border bg-muted p-5 md:p-6 lg:grid-cols-[240px_1fr_auto]"
      >
        <PlaceholderArt
          region="contribution"
          className="h-36 w-full max-w-sm"
        />
        <div>
          <h2
            id="contribute-heading"
            className="font-slab text-2xl font-bold md:text-3xl"
          >
            Made something your players loved?
          </h2>
          <p className="mt-2">
            Share a creature, an adventure, a rule—or a whole collection.
          </p>
        </div>
        <div className="space-y-2">
          <Button size="lg" asChild>
            <Link href="/my/library">
              Share your creation <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="text-sm">Sign in to publish.</p>
        </div>
      </section>
    </div>
  );
}
