"use client";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { Link } from "@/components/app/Link";
import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/FormattedText";
import {
  CardContent,
  CardHeader,
  CardTitle,
  Card as UICard,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Subclass, User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardProps {
  subclass: Subclass;
  creator?: User | null;
  link?: boolean;
  hideActions?: boolean;
  className?: string;
}

export function Card({ subclass, creator, link = true, className }: CardProps) {
  const conditions = useConditions();
  const cardContent = (
    <UICard className={className}>
      <CardHeader className={cn(subclass.description && "pb-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex flex-col text-xl font-bold uppercase leading-tight text-center font-slab">
              <span className="self-center w-fit mb-2 py-1 px-2 bg-muted text-sm font-sab font-normal">
                {subclass.className}
              </span>
              <span>— {subclass.namePreface} —</span>
              <span className="text-4xl">{subclass.name}</span>
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {subclass.description && (
          <div className="text-center text-sm text-muted-foreground italic">
            <FormattedText
              className="[&_p_~_p]:mt-0.5"
              content={subclass.description}
              conditions={conditions.allConditions}
            />
          </div>
        )}

        {subclass.levels.map((levelData) => (
          <div key={levelData.level}>
            <h4 className="font-stretch-condensed font-bold uppercase italic text-sm text-muted-foreground">
              Level {levelData.level}
            </h4>
            <div className="space-y-3">
              {levelData.abilities.map((ability) => (
                <div key={ability.name} className="space-y-1 text-sm">
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

      <CardFooterLayout creator={creator || subclass.creator} />
    </UICard>
  );

  if (link) {
    return (
      <Link href={`/subclasses/${subclass.id}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
