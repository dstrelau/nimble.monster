import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { findCustomRule } from "@/lib/db/custom-rule";
import { SITE_NAME } from "@/lib/utils/branding";
import { deslugify } from "@/lib/utils/slug";
import { CustomRuleForm } from "../../CustomRuleForm";
import { buildSectionGroups } from "../../sections";

export const metadata: Metadata = {
  title: `Edit Custom Rule - ${SITE_NAME}`,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomRulePage({ params }: PageProps) {
  const { id } = await params;
  const uid = deslugify(id);
  if (!uid) notFound();

  const [rule, session] = await Promise.all([findCustomRule(uid), auth()]);
  if (!rule) notFound();
  if (session?.user?.id !== rule.creator.id) redirect("/custom-rules");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit Custom Rule</h1>
      <CustomRuleForm rule={rule} sectionGroups={buildSectionGroups()} />
    </div>
  );
}
