import { ShieldMinus, ShieldOff, ShieldPlus } from "lucide-react";
import { Link } from "@/components/layout/Link";
import { MonsterImage } from "@/components/monster/MonsterImage";
import {
  ArmorStat,
  BurrowIcon,
  ClimbIcon,
  FlyIcon,
  HPStat,
  SavesStat,
  SpeedIcon,
  Stat,
  SwimIcon,
  TeleportIcon,
} from "@/components/monster/Stat";
import { Level } from "@/components/shared/Level";
import type { MonsterFormState } from "@/lib/services/monsters";
import { cn } from "@/lib/utils";
import { formatHp, formatSizeKind } from "@/lib/utils/monster";
import { getMonsterUrl } from "@/lib/utils/url";

// The 88px medallion is centered on the band, so it hangs (88 - band) / 2 above
// and below it. It only reaches the name once that exceeds the 12px gap.
const MEDALLION_REACHES_NAME_BELOW_BAND_HEIGHT = 64;

// Stats wrap with the card's width, so watch the band and let CSS react.
export function flagTallBand(band: HTMLDivElement | null) {
  const header = band?.parentElement;
  if (!band || !header) return;
  const update = () =>
    header.toggleAttribute(
      "data-band-tall",
      band.offsetHeight >= MEDALLION_REACHES_NAME_BELOW_BAND_HEIGHT
    );
  update();
  const observer = new ResizeObserver(update);
  observer.observe(band);
  return () => observer.disconnect();
}

// Beside the name, the centered medallion can hang below the header into the
// content. Publish by how much, so the first lines of text can wrap around it.
function trackMedallionOverlap(row: HTMLDivElement | null) {
  const header = row?.parentElement;
  const card = header?.parentElement;
  const content = header?.nextElementSibling;
  const image = row?.querySelector("img");
  if (!row || !card || !content || !image) return;
  const update = () => {
    const overlap =
      image.getBoundingClientRect().bottom -
      content.getBoundingClientRect().top;
    card.style.setProperty(
      "--medallion-overlap",
      overlap > 0 ? `${Math.ceil(overlap) + 4}px` : "0px"
    );
  };
  update();
  const observer = new ResizeObserver(update);
  observer.observe(row);
  return () => observer.disconnect();
}

interface MonsterCardHeaderProps {
  monster: MonsterFormState;
  link?: boolean;
}

/** The label tab above a card; leaves room for a medallion on the right. */
export function CardTab({
  hasArtwork,
  children,
}: {
  hasArtwork: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-level-label
      className={cn(
        "ml-3 w-fit rounded-t-lg bg-muted-foreground px-3 py-1 font-condensed text-sm/4 font-black italic text-background uppercase wrap-anywhere",
        hasArtwork ? "max-w-[calc(100%-6rem)]" : "max-w-[calc(100%-1.5rem)]"
      )}
    >
      {children}
    </div>
  );
}

export function MonsterCardLevelTab({ monster }: MonsterCardHeaderProps) {
  const hasArtwork = !!(monster.paperforgeId || monster.customArtwork);

  return (
    <CardTab hasArtwork={hasArtwork}>
      {monster.levelInt !== 0 && (
        <>
          Lvl <Level level={monster.level} />
          {monster.legendary ? " " : ", "}
        </>
      )}
      {monster.hazard
        ? "Hazard"
        : monster.members?.length
          ? "Legendary team"
          : monster.legendary
            ? `Legendary ${formatSizeKind(monster)}`
            : `${monster.minion ? "Minion " : ""}${monster.size}`}
      {!!monster.members?.length && monster.kind && ` ${monster.kind}`}
    </CardTab>
  );
}

/** What the header shows, and where its artwork goes. */
export function getHeaderLayout(monster: MonsterFormState) {
  const isTeam = !!monster.members?.length;
  const hasArtwork = !!(monster.paperforgeId || monster.customArtwork);
  // Legendary records store unused movement as zero, not an immobile creature.
  const showSpeed =
    monster.speed !== 6 && (!monster.legendary || monster.speed > 0);
  const hasMovement =
    !monster.hazard &&
    !isTeam &&
    (showSpeed ||
      [
        monster.swim,
        monster.fly,
        monster.climb,
        monster.burrow,
        monster.teleport,
      ].some(Boolean));
  const hasCombatBand =
    !isTeam &&
    (monster.hazard
      ? monster.hp > 0
      : !monster.minion || hasMovement || !!monster.saves);
  // Without a combat band, artwork moves into the name row.
  const artworkBesideName = hasArtwork && !isTeam && !hasCombatBand;
  return {
    isTeam,
    hasArtwork,
    hasMovement,
    showSpeed,
    hasCombatBand,
    artworkBesideName,
  };
}

export function MonsterCardHeader({
  monster,
  link = false,
}: MonsterCardHeaderProps) {
  const {
    isTeam,
    hasArtwork,
    hasMovement,
    showSpeed,
    hasCombatBand,
    artworkBesideName,
  } = getHeaderLayout(monster);
  return (
    <div data-slot="card-header" className="group space-y-3">
      {hasCombatBand && (
        <div
          ref={flagTallBand}
          className={cn(
            "relative -mt-3 flex items-center rounded-t-xl border-b bg-muted px-2 py-1.5"
          )}
        >
          <div
            className={cn("w-full font-slab font-black", hasArtwork && "pr-20")}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-x-4">
                {!monster.hazard &&
                  !monster.minion &&
                  monster.armor !== "none" && (
                    <ArmorStat value={monster.armor === "heavy" ? "H" : "M"} />
                  )}
                {!monster.minion && (
                  <HPStat
                    value={
                      monster.hazard ? String(monster.hp) : formatHp(monster)
                    }
                  />
                )}
              </div>
              {hasMovement && (
                <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1">
                  <Stat name="swim" value={monster.swim} SvgIcon={SwimIcon} />
                  <Stat name="fly" value={monster.fly} SvgIcon={FlyIcon} />
                  <Stat
                    name="climb"
                    value={monster.climb}
                    SvgIcon={ClimbIcon}
                  />
                  <Stat
                    name="burrow"
                    value={monster.burrow}
                    SvgIcon={BurrowIcon}
                  />
                  <Stat
                    name="teleport"
                    value={monster.teleport}
                    SvgIcon={TeleportIcon}
                  />
                  {showSpeed && (
                    <Stat
                      name="speed"
                      value={monster.speed}
                      SvgIcon={SpeedIcon}
                      showZero
                    />
                  )}
                </div>
              )}
              {!monster.hazard && monster.saves && (
                <SavesStat className="max-w-full">
                  <span className="sr-only">Saves:</span>{" "}
                  <span className="min-w-0 wrap-anywhere">{monster.saves}</span>
                </SavesStat>
              )}
            </div>
          </div>
          {hasArtwork && (
            <MonsterImage
              paperforgeId={monster.paperforgeId}
              customArtwork={monster.customArtwork}
              size={88}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 size-22"
            />
          )}
        </div>
      )}
      <div
        ref={artworkBesideName ? trackMedallionOverlap : undefined}
        className={cn("px-4", artworkBesideName && "relative")}
      >
        <div className={cn("min-w-0", artworkBesideName && "pr-20")}>
          {hasArtwork && hasCombatBand && (
            <div
              aria-hidden
              className="float-right h-5 w-18 group-data-band-tall:hidden"
            />
          )}
          <h3
            className={cn(
              "font-slab font-bold wrap-anywhere",
              monster.legendary ? "text-3xl/8" : "small-caps text-2xl/6"
            )}
          >
            {link && monster.id ? (
              <Link href={getMonsterUrl(monster)}>{monster.name}</Link>
            ) : (
              monster.name
            )}
          </h3>
          {!monster.hazard && !monster.legendary && !isTeam && monster.kind && (
            <div className="mt-1 text-sm/4 font-condensed text-muted-foreground small-caps">
              {monster.kind}
            </div>
          )}
        </div>
        {artworkBesideName && (
          <MonsterImage
            paperforgeId={monster.paperforgeId}
            customArtwork={monster.customArtwork}
            size={88}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 size-22"
          />
        )}
      </div>
      {(!!monster.vulnerabilities?.length ||
        !!monster.resistances?.length ||
        !!monster.immunities?.length) && (
        <div
          className="flex flex-wrap gap-x-4 gap-y-1 px-4 text-sm/5"
          data-damage-interactions
        >
          {[
            {
              label: "Vulnerable",
              values: monster.vulnerabilities ?? [],
              Icon: ShieldMinus,
            },
            {
              label: "Resistant",
              values: monster.resistances ?? [],
              Icon: ShieldPlus,
            },
            {
              label: "Immune",
              values: monster.immunities ?? [],
              Icon: ShieldOff,
            },
          ].map(({ label, values, Icon }) =>
            values.length ? (
              <div key={label} className="flex max-w-full items-start gap-1.5">
                <Icon
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-stat-icon"
                />
                <div className="min-w-0 wrap-anywhere">
                  <strong>{label}:</strong>{" "}
                  <span className="capitalize">{values.join(", ")}</span>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
