import type { Metadata } from "next";
import { AwardBadge } from "@/components/AwardBadge";
import { Link } from "@/components/app/Link";
import { Item } from "@/components/ui/item";
import { getAllAwards } from "@/lib/db/award";
import { SITE_NAME } from "@/lib/utils/branding";

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
    title: "Awards",
    description: `Awards | ${SITE_NAME}`,
  };
}

export default async function AwardPage() {
  const awards = await getAllAwards();

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col items-center gap-4">
        {awards.map((award) => (
          <Item
            key={award.id}
            variant="outline"
            className="w-full flex justify-between items-center gap-4"
          >
            <Link href={`/awards/${award.slug}`}>
              <h3 className="text-xl font-bold font-slab">{award.name}</h3>
            </Link>
            <p>{award.description}</p>
            <AwardBadge award={award} />
          </Item>
        ))}
      </div>
    </div>
  );
}
