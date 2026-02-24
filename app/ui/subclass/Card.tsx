"use client";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { Link } from "@/components/app/Link";
import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/FormattedText";
import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
  Card as UICard,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Subclass, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSubclassUrl } from "@/lib/utils/url";

interface CardProps {
  subclass: Subclass;
  creator?: User | null;
  link?: boolean;
  hideActions?: boolean;
  className?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function Card({
  subclass,
  creator,
  link = true,
  className,
  selectable = false,
  selected = false,
  onSelect,
}: CardProps) {
  const conditions = useConditions();
  const cardContent = (
    <UICard
      className={cn(
        className,
        selectable && selected && "ring-2 ring-amber-500"
      )}
      {...(selectable && selected && { "data-selected": "" })}
    >
      <CardHeader className={cn(subclass.description && "pb-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex flex-col text-xl font-bold uppercase leading-tight text-center font-slab">
              <span className="self-center w-fit mb-2 py-1 px-2 bg-muted text-sm font-sab font-normal">
                {subclass.className}
              </span>
              {link ? (
                <Link href={getSubclassUrl(subclass)}>
                  {subclass.namePreface && (
                    <span>— {subclass.namePreface} —</span>
                  )}
                  <span className="text-4xl">{subclass.name}</span>
                </Link>
              ) : (
                <>
                  {subclass.namePreface && (
                    <span>— {subclass.namePreface} —</span>
                  )}
                  <span className="text-4xl">{subclass.name}</span>
                </>
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn("pt-0 space-y-4", selectable && "pointer-events-none")}
      >
        {subclass.tagline && (
          <div className="text-center text-base text-muted-foreground italic">
            <FormattedText
              className="[&_p_~_p]:mt-0.5"
              content={subclass.tagline}
              conditions={conditions.allConditions}
            />
          </div>
        )}

        {subclass.description && (
          <FormattedText
            className="text-base [&_p_~_p]:mt-0.5"
            content={subclass.description}
            conditions={conditions.allConditions}
          />
        )}

        {subclass.levels.map((levelData) => (
          <div key={levelData.level}>
            <h4 className="font-stretch-condensed font-bold uppercase italic text-base text-muted-foreground">
              Level {levelData.level}
            </h4>
            <div className="space-y-3">
              {levelData.abilities.map((ability) => (
                <div key={ability.id} className="space-y-1 text-base">
                  <PrefixedFormattedText
                    prefix={
                      <h5 className="font-semibold inline">{ability.name}.</h5>
                    }
                    content={ability.description}
                    conditions={conditions.allConditions}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooterLayout
        className={cn(selectable && "pointer-events-none")}
        creator={creator || subclass.creator}
        source={subclass.source}
        awards={subclass.awards}
        actionsSlot={
          subclass.visibility === "private" && (
            <Badge variant="default" className="h-6">
              Private
            </Badge>
          )
        }
      />
    </UICard>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={cn(
          "w-full cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
        onClick={onSelect}
      >
        {cardContent}
      </button>
    );
  }

  return cardContent;
}
