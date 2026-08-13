"use client";

import { FormattedText } from "@/components/shared/FormattedText";
import { useConditions } from "@/lib/hooks/useConditions";

interface Props {
  content: string;
  creatorDiscordId: string;
}

export function CustomRuleBody({ content, creatorDiscordId }: Props) {
  const { allConditions } = useConditions({
    creatorId: creatorDiscordId,
    enabled: !!content,
  });

  return (
    <FormattedText
      content={content}
      conditions={allConditions}
      blockStyles
      enableHeadings
    />
  );
}
