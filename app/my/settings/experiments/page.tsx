import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { Card } from "@/components/monster/Card";
import { auth } from "@/lib/auth";
import { FeatureFlagsProvider } from "@/lib/contexts/FeatureFlagsContext";
import { getEnabledFeatureFlags } from "@/lib/services/featureFlags";
import { monstersService } from "@/lib/services/monsters";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/utils/branding";
import { MonsterCardLayoutToggle } from "./MonsterCardLayoutToggle";

export const metadata: Metadata = {
  title: `Experimental Features - ${SITE_NAME}`,
};

export default async function ExperimentsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const previewParams = { sort: "-createdAt", type: "all", limit: 2 } as const;
  const [enabledFeatures, { data: myMonsters }] = await Promise.all([
    getEnabledFeatureFlags(session.user.id),
    monstersService.paginateMyMonsters(session.user.id, previewParams),
  ]);
  const monsters =
    myMonsters.length > 0
      ? myMonsters
      : (
          await monstersService.paginatePublicMonsters({
            ...previewParams,
            creatorId: OFFICIAL_USER_ID,
          })
        ).data;

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader icon={FlaskConical} title="Experimental Features" />
      <section className="space-y-6 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <MonsterCardLayoutToggle
          enabled={enabledFeatures.includes("monster-card-layout")}
        />
        <FeatureFlagsProvider
          enabledFeatures={[...enabledFeatures, "monster-card-layout"]}
        >
          <section aria-label="New monster card preview" className="@container">
            <div className="grid items-start gap-6 @min-[44rem]:grid-cols-2">
              {monsters.map((monster) => (
                <div
                  key={monster.id}
                  className={cn(
                    (monster.legendary || (monster.members?.length ?? 0) > 0) &&
                      "@min-[44rem]:col-span-2"
                  )}
                >
                  <Card
                    monster={monster}
                    creator={monster.creator}
                    hideDescription
                  />
                </div>
              ))}
            </div>
          </section>
        </FeatureFlagsProvider>
      </section>
    </div>
  );
}
