"use client";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { Link } from "@/components/app/Link";
import { FormattedText } from "@/components/FormattedText";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Card as ShadcnCard,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Background } from "@/lib/services/backgrounds";
import type { User } from "@/lib/types";
import { getBackgroundUrl } from "@/lib/utils/url";

interface BackgroundCardProps {
  background: Background;
  creator?: User;
  link?: boolean;
}

export const Card = ({
  background,
  creator,
  link = true,
}: BackgroundCardProps) => {
  const { allConditions: conditions } = useConditions({
    creatorId: creator?.discordId,
  });

  return (
    <ShadcnCard className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold font-slab">
          {link && background.id ? (
            <Link href={getBackgroundUrl(background)}>{background.name}</Link>
          ) : (
            background.name
          )}
        </CardTitle>
        {background.requirement && (
          <CardDescription className="italic">
            Requirement: {background.requirement}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <FormattedText
          content={background.description}
          conditions={conditions}
        />
      </CardContent>
      <CardFooterLayout
        creator={creator || background.creator}
        source={background.source}
        awards={background.awards}
      />
    </ShadcnCard>
  );
};
