"use client";

import { useState } from "react";
import type { ItemSortOption } from "@/app/items/actions";
import { Card } from "@/components/item/Card";
import { CardGrid } from "@/components/item/CardGrid";
import { ItemFilterBar } from "@/components/item/ItemFilterBar";
import { List } from "@/components/item/List";
import { ModeToggle } from "@/components/layout/ModeToggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Item, ItemRarityFilter } from "@/lib/services/items";
import { cn } from "@/lib/utils";
import {
  ITEM_BACKDROP_FIXTURES,
  ITEM_CONTENT_FIXTURES,
  ITEM_GRID_FIXTURES,
  ITEM_LAB_CREATOR,
  ITEM_LIST_FIXTURES,
  ITEM_RARITY_FIXTURES,
  ITEM_STATE_FIXTURES,
} from "./fixtures";

type CardWidth = "narrow" | "standard" | "wide";

const CARD_WIDTH_CLASSES: Record<CardWidth, string> = {
  narrow: "w-full sm:w-80",
  standard: "w-full sm:w-md",
  wide: "w-full sm:w-2xl",
};

function isCardWidth(value: string): value is CardWidth {
  return value === "narrow" || value === "standard" || value === "wide";
}

interface Fixture {
  label: string;
  description?: string;
  item: Item;
}

interface FixtureGalleryProps {
  fixtures: Fixture[];
  width: CardWidth;
  hideDescription: boolean;
  noInteractive: boolean;
}

function FixtureGallery({
  fixtures,
  width,
  hideDescription,
  noInteractive,
}: FixtureGalleryProps) {
  return (
    <div className="flex flex-wrap items-start gap-6">
      {fixtures.map((fixture) => (
        <article
          key={fixture.label}
          className={cn("space-y-2", CARD_WIDTH_CLASSES[width])}
        >
          <div>
            <h3 className="font-semibold">{fixture.label}</h3>
            {fixture.description && (
              <p className="text-muted-foreground text-sm">
                {fixture.description}
              </p>
            )}
          </div>
          <Card
            item={fixture.item}
            creator={fixture.item.creator}
            hideActions
            hideDescription={hideDescription}
            noInteractive={noInteractive}
          />
        </article>
      ))}
    </div>
  );
}

function LabSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-slab font-bold text-2xl">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function CatalogControls() {
  const [search, setSearch] = useState<string | null>(null);
  const [sort, setSort] = useState<ItemSortOption>("-createdAt");
  const [rarity, setRarity] = useState<ItemRarityFilter>("all");
  const [source, setSource] = useState<string | null>(null);

  return (
    <ItemFilterBar
      searchTerm={search}
      sortOption={sort}
      rarityFilter={rarity}
      onSearch={setSearch}
      onSortChange={setSort}
      onRarityChange={setRarity}
      source={source}
      onSourceChange={setSource}
    />
  );
}

export function ItemLab() {
  const [width, setWidth] = useState<CardWidth>("standard");
  const [hideDescription, setHideDescription] = useState(false);
  const [noInteractive, setNoInteractive] = useState(false);
  const [selectedIds, setSelectedIds] = useState([ITEM_LIST_FIXTURES[1].id]);

  const galleryProps = { width, hideDescription, noInteractive };
  const toggleSelectedItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-12 px-4 py-8 md:px-8">
      <header className="space-y-2">
        <p className="font-semibold text-muted-foreground text-sm uppercase tracking-widest">
          Entity Lab
        </p>
        <h1 className="font-slab font-black text-4xl">Items</h1>
        <p className="max-w-3xl text-muted-foreground">
          Development-only fixtures for reviewing item presentation without
          creating database records. Change the controls to expose responsive
          and conditional rendering issues across every example.
        </p>
      </header>

      <section
        aria-label="Item lab controls"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-card p-3"
      >
        <div className="flex items-center gap-2">
          <Label>Theme</Label>
          <ModeToggle />
        </div>
        <div className="flex items-center gap-2">
          <Label id="card-width-label">Card width</Label>
          <ToggleGroup
            type="single"
            value={width}
            aria-labelledby="card-width-label"
            variant="outline"
            size="sm"
            onValueChange={(value) => {
              if (isCardWidth(value)) setWidth(value);
            }}
          >
            <ToggleGroupItem value="narrow">Narrow</ToggleGroupItem>
            <ToggleGroupItem value="standard">Standard</ToggleGroupItem>
            <ToggleGroupItem value="wide">Wide</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hide-descriptions"
            checked={hideDescription}
            onCheckedChange={(checked) => setHideDescription(checked === true)}
          />
          <Label htmlFor="hide-descriptions">Hide descriptions</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="disable-interactions"
            checked={noInteractive}
            onCheckedChange={(checked) => setNoInteractive(checked === true)}
          />
          <Label htmlFor="disable-interactions">Disable interactions</Label>
        </div>
      </section>

      <LabSection
        title="Catalog controls"
        description="Search, rarity, source, and sorting controls used by item catalogs and pickers."
      >
        <CatalogControls />
      </LabSection>

      <LabSection
        title="Rarity"
        description="Every rarity treatment with otherwise consistent content."
      >
        <FixtureGallery fixtures={ITEM_RARITY_FIXTURES} {...galleryProps} />
      </LabSection>

      <LabSection
        title="Image backdrops"
        description="Every supported image backdrop using a consistent icon and palette."
      >
        <FixtureGallery fixtures={ITEM_BACKDROP_FIXTURES} {...galleryProps} />
      </LabSection>

      <LabSection
        title="Responsive card grid"
        description="The one-, two-, and three-column layout used by libraries and profiles."
      >
        <CardGrid items={ITEM_GRID_FIXTURES} hideActions />
      </LabSection>

      <LabSection
        title="Content and metadata"
        description="Representative content, formatting, overflow, and footer edge cases."
      >
        <FixtureGallery fixtures={ITEM_CONTENT_FIXTURES} {...galleryProps} />
      </LabSection>

      <LabSection
        title="List rows"
        description="Compact item presentation used by pickers and selection lists."
      >
        <div className="grid max-w-5xl gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold">Clickable selection</h3>
            <div className="overflow-hidden rounded-lg border bg-card">
              <List
                items={ITEM_LIST_FIXTURES}
                selectedIds={selectedIds}
                handleItemClick={toggleSelectedItem}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Checkbox selection</h3>
            <div className="overflow-hidden rounded-lg border bg-card">
              <List
                items={ITEM_LIST_FIXTURES}
                selectedIds={selectedIds}
                handleItemClick={toggleSelectedItem}
                showChecks
              />
            </div>
          </div>
        </div>
      </LabSection>

      <LabSection
        title="Component states"
        description="Card prop combinations used by lists, pickers, and previews."
      >
        <div className="flex flex-wrap items-start gap-6">
          <article className={cn("space-y-2", CARD_WIDTH_CLASSES[width])}>
            <h3 className="font-semibold">Default</h3>
            <Card
              item={ITEM_STATE_FIXTURES.default}
              creator={ITEM_LAB_CREATOR}
              hideActions
            />
          </article>
          <article className={cn("space-y-2", CARD_WIDTH_CLASSES[width])}>
            <h3 className="font-semibold">Description hidden</h3>
            <Card
              item={ITEM_STATE_FIXTURES.descriptionHidden}
              creator={ITEM_LAB_CREATOR}
              hideActions
              hideDescription
            />
          </article>
          <article className={cn("space-y-2", CARD_WIDTH_CLASSES[width])}>
            <h3 className="font-semibold">Non-interactive</h3>
            <Card
              item={ITEM_STATE_FIXTURES.nonInteractive}
              creator={ITEM_LAB_CREATOR}
              noInteractive
            />
          </article>
          <article className={cn("space-y-2", CARD_WIDTH_CLASSES[width])}>
            <h3 className="font-semibold">Selectable and selected</h3>
            <Card
              item={ITEM_STATE_FIXTURES.selected}
              creator={ITEM_LAB_CREATOR}
              selectable
              selected
            />
          </article>
        </div>
      </LabSection>
    </div>
  );
}
