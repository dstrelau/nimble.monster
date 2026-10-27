import { ShieldMinus, ShieldPlus } from "lucide-react";
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
import { formatHp } from "@/lib/utils/monster";
import { getMonsterUrl } from "@/lib/utils/url";

export interface MonsterDamageInteractions {
  vulnerable: readonly string[];
  resistant: readonly string[];
}

interface MonsterCardHeaderProps {
  monster: MonsterFormState;
  link?: boolean;
  damageInteractions?: MonsterDamageInteractions;
}

export function MonsterCardLevelTab({ monster }: MonsterCardHeaderProps) {
  const hasArtwork = !!(monster.paperforgeId || monster.customArtwork);

  return (
    <div
      data-level-label
      className={cn(
        "ml-3 w-fit rounded-t-lg bg-muted-foreground px-3 py-1 font-condensed text-sm/4 font-black italic text-background uppercase wrap-anywhere",
        hasArtwork ? "max-w-[calc(100%-6rem)]" : "max-w-[calc(100%-1.5rem)]"
      )}
    >
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
          : `${monster.legendary ? "Legendary " : monster.minion ? "Minion " : ""}${monster.size}`}
      {(monster.legendary || !!monster.members?.length) &&
        monster.kind &&
        ` ${monster.kind}`}
    </div>
  );
}

export function MonsterCardHeader({
  monster,
  link = false,
  damageInteractions,
}: MonsterCardHeaderProps) {
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
      : !monster.minion || hasArtwork || hasMovement || !!monster.saves);
  return (
    <div data-slot="card-header" className="space-y-3">
      {hasCombatBand && (
        <div
          className={cn(
            "relative -mt-4 flex items-center rounded-t-xl border-b bg-muted px-2 py-1.5",
            hasArtwork && "min-h-16"
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
      <div className="px-4">
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
      {damageInteractions &&
        (damageInteractions.vulnerable.length > 0 ||
          damageInteractions.resistant.length > 0) && (
          <div
            className="flex flex-wrap gap-x-4 gap-y-1 px-4 text-sm/5"
            data-damage-interactions
          >
            {[
              {
                label: "Vulnerable",
                values: damageInteractions.vulnerable,
                Icon: ShieldMinus,
              },
              {
                label: "Resistant",
                values: damageInteractions.resistant,
                Icon: ShieldPlus,
              },
            ].map(({ label, values, Icon }) =>
              values.length ? (
                <div
                  key={label}
                  className="flex max-w-full items-start gap-1.5"
                >
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
