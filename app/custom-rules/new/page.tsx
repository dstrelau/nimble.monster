import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SITE_NAME } from "@/lib/utils/branding";
import { CustomRuleForm } from "../CustomRuleForm";
import { buildRuleGroups } from "../rule-options";

export const metadata: Metadata = {
  title: `New Custom Rule - ${SITE_NAME}`,
};

export default async function NewCustomRulePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/custom-rules");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">New Custom Rule</h1>
      <CustomRuleForm
        rule={{
          id: "",
          name: "",
          content: "",
          keywords: "",
          visibility: "public",
          links: [],
        }}
        ruleGroups={buildRuleGroups()}
        creatorDiscordId={session.user.discordId}
        isCreating
      />
    </div>
  );
}
