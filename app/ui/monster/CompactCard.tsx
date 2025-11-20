import { ArrowLeft } from "lucide-react";
import { PaperforgeImage } from "@/components/PaperforgeImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Monster } from "@/lib/services/monsters/types";
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
} from "./Stat";

interface CompactCardProps {
  monster: Monster;
  onBack: () => void;
  hasSelection: boolean;
  isLinked: boolean;
  onLinkToken: () => void;
  onAddToScene: () => void;
}

export function CompactCard({
  monster,
  onBack,
  hasSelection,
  isLinked,
  onLinkToken,
  onAddToScene,
}: CompactCardProps) {
  const allAbilities = [
    ...monster.families.flatMap((f) => f.abilities),
    ...monster.abilities,
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col gap-2 p-4 border-b">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex-1"
          >
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
          {hasSelection && (
            <Button
              variant={isLinked ? "destructive" : "default"}
              size="sm"
              onClick={onLinkToken}
              className="flex-1"
            >
              {isLinked ? "Unlink" : "Link Token"}
            </Button>
          )}
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={onAddToScene}
          title={"Add token to scene"}
          className="w-full"
          disabled={!monster.paperforgeId}
        >
          {monster.paperforgeId ? "Add to Scene" : "No icon available"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            {monster.paperforgeId && (
              <PaperforgeImage
                id={monster.paperforgeId}
                className="size-19 flex-shrink-0"
                size={76}
              />
            )}
            <div className="flex-1 space-y-2">
              <h2 className="font-slab font-bold text-2xl leading-tight">
                {monster.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Level {monster.level} {monster.size}{" "}
                {monster.kind && `${monster.kind} `}
                {monster.legendary && "(Legendary)"}
              </p>
            </div>
            {monster.creator.displayName && (
              <Avatar className="size-10 flex-shrink-0">
                <AvatarImage
                  src={monster.creator.imageUrl}
                  alt={monster.creator.displayName}
                />
                <AvatarFallback>
                  {monster.creator.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center font-slab font-black">
            <HPStat value={monster.hp} />
            {monster.armor === "medium" && <ArmorStat value="M" />}
            {monster.armor === "heavy" && <ArmorStat value="H" />}
            {monster.saves && (
              <SavesStat>
                <div className="flex flex-col">
                  {monster.saves.split(",").map((save) => (
                    <span key={save} className="block">
                      {save}
                    </span>
                  ))}
                </div>
              </SavesStat>
            )}
            <Stat name="speed" value={monster.speed} SvgIcon={SpeedIcon} />
            <Stat name="swim" value={monster.swim} SvgIcon={SwimIcon} />
            <Stat name="fly" value={monster.fly} SvgIcon={FlyIcon} />
            <Stat name="climb" value={monster.climb} SvgIcon={ClimbIcon} />
            <Stat name="burrow" value={monster.burrow} SvgIcon={BurrowIcon} />
            <Stat
              name="teleport"
              value={monster.teleport}
              SvgIcon={TeleportIcon}
            />
          </div>

          {allAbilities.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-slab font-bold text-lg">Abilities</h3>
              <ul className="space-y-2">
                {allAbilities.map((ability) => (
                  <li key={ability.id} className="space-y-1">
                    <div className="font-medium">{ability.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {ability.description}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {monster.actions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-slab font-bold text-lg">
                {monster.legendary ? "Legendary Actions" : "Actions"}
              </h3>
              {monster.actionPreface && (
                <p className="text-sm text-muted-foreground">
                  {monster.actionPreface}
                </p>
              )}
              <ul className="space-y-2">
                {monster.actions.map((action) => (
                  <li key={action.id} className="space-y-1">
                    <div className="font-medium">
                      {action.name}
                      {action.damage && ` (${action.damage})`}
                      {action.range && (
                        <span className="text-muted-foreground">
                          {" "}
                          • {action.range}
                        </span>
                      )}
                    </div>
                    {action.description && (
                      <div className="text-sm text-muted-foreground">
                        {action.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {monster.legendary && monster.bloodied && (
            <div className="space-y-2">
              <h3 className="font-slab font-bold text-lg">Bloodied</h3>
              <p className="text-sm text-muted-foreground">
                {monster.bloodied}
              </p>
            </div>
          )}

          {monster.legendary && monster.lastStand && (
            <div className="space-y-2">
              <h3 className="font-slab font-bold text-lg">Last Stand</h3>
              <p className="text-sm text-muted-foreground">
                {monster.lastStand}
              </p>
            </div>
          )}

          {monster.moreInfo && (
            <div className="space-y-2">
              <h3 className="font-slab font-bold text-lg">More Info</h3>
              <p className="text-sm text-muted-foreground">
                {monster.moreInfo}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
