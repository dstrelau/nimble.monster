import { Attribution } from "@/app/ui/Attribution";
import { EditDeleteButtons } from "@/app/ui/CollectionEditDelete";
import { VisibilityBadge } from "@/app/ui/VisibilityBadge";
import { Link } from "@/components/app/Link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CollectionOverview } from "@/lib/types";

export const CollectionCard = ({
  collection,
  showEditDeleteButtons,
  showVisibilityBadge,
  showAttribution,
}: {
  collection: CollectionOverview;
  showEditDeleteButtons: boolean;
  showVisibilityBadge: boolean;
  showAttribution: boolean;
}) => {
  return (
    <Card key={collection.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <Link href={`/collections/${collection.id}`} className="block">
            <CardTitle>{collection.name}</CardTitle>
          </Link>
          {showVisibilityBadge && (
            <VisibilityBadge visibility={collection.visibility} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-condensed text-sm text-muted-foreground">
          {collection.standardCount} monsters |{" "}
          <span className="text-accent">
            {collection.legendaryCount} legendary
          </span>
        </div>
      </CardContent>
      {(showAttribution || showEditDeleteButtons) && (
        <>
          <Separator />
          <CardFooter>
            <div className="flex justify-between w-full">
              <Attribution user={collection.creator} />
              {showEditDeleteButtons && (
                <EditDeleteButtons id={collection.id} />
              )}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};
