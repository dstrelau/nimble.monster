import type React from "react";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { MoreInfoSection } from "@/app/ui/shared/MoreInfoSection";
import { CardContainer } from "@/app/ui/shared/StyledComponents";
import { FormattedText } from "@/components/app/FormattedText";
import { Link } from "@/components/app/Link";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Item, User } from "@/lib/types";

const HeaderItem: React.FC<{
  item: Item;
  link?: boolean;
}> = ({ item, link = true }) => (
  <CardHeader>
    <CardTitle className="font-slab font-black text-2xl leading-tight">
      {link && item.id ? (
        <Link href={`/items/${item.id}`}>{item.name}</Link>
      ) : (
        item.name
      )}
    </CardTitle>
    {item.kind && (
      <CardDescription className="font-condensed text-md">
        {item.kind}
      </CardDescription>
    )}
  </CardHeader>
);

interface CardProps {
  item: Item;
  creator?: User;
  isOwner?: boolean;
  link?: boolean;
  hideActions?: boolean;
  hideCreator?: boolean;
  className?: string;
}

export const Card = ({
  item,
  creator,
  isOwner: _isOwner = false,
  link = true,
  hideActions = false,
  hideCreator = false,
  className,
}: CardProps) => {
  return (
    <div id={`item-${item.id}`}>
      <CardContainer className={className}>
        <HeaderItem item={item} link={link} />

        <CardContent className="flex flex-col gap-3 pt-0 pb-4">
          {item.description && (
            <p>
              <FormattedText text={item.description} />
            </p>
          )}

          <MoreInfoSection moreInfo={item.moreInfo} conditions={[]} />
        </CardContent>

        <CardFooterLayout
          creator={creator}
          hideCreator={hideCreator}
          hideActions={hideActions}
        />
      </CardContainer>
    </div>
  );
};
