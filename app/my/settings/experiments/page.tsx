import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { auth } from "@/lib/auth";
import {
  getEnabledFeatureFlags,
  getSetFeatureFlags,
} from "@/lib/services/featureFlags";
import { SITE_NAME } from "@/lib/utils/branding";
import { FeatureFlagToggle } from "./FeatureFlagToggle";

export const metadata: Metadata = {
  title: `Experimental Features - ${SITE_NAME}`,
};

const CUSTOM_IMAGE_UPLOADS_CONFIRMATION = {
  title: "Before you upload images",
  description: (
    <>
      <p>
        Only upload images you have the right to share here, such as your own
        artwork or images whose license permits this use. Follow any attribution
        requirements in that license.
      </p>
      <p>
        Uploading copyrighted images without permission, or otherwise breaking
        these rules, will result in the immediate deactivation of your{" "}
        {SITE_NAME} account and the permanent removal of all your content.
      </p>
    </>
  ),
};

export default async function ExperimentsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [enabledFeatures, setFeatures] = await Promise.all([
    getEnabledFeatureFlags(session.user.id),
    getSetFeatureFlags(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader icon={FlaskConical} title="Experimental Features" />
      <section className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <FeatureFlagToggle
          feature="monster-card-layout"
          label="New Monster Card Styling"
          enabled={enabledFeatures.includes("monster-card-layout")}
        />
      </section>
      <section className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <FeatureFlagToggle
          feature="monster-custom-artwork"
          label="Custom Image Uploads"
          enabled={enabledFeatures.includes("monster-custom-artwork")}
          confirmation={
            setFeatures.includes("monster-custom-artwork")
              ? undefined
              : CUSTOM_IMAGE_UPLOADS_CONFIRMATION
          }
        />
      </section>
    </div>
  );
}
