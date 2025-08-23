import type React from "react";
import { WithConditionsTooltips } from "@/components/WithConditionsTooltips";
import type { MonsterCondition } from "@/lib/types";

interface MoreInfoSectionProps {
  moreInfo?: string;
  conditions: MonsterCondition[];
}

export const MoreInfoSection: React.FC<MoreInfoSectionProps> = ({
  moreInfo,
  conditions,
}) => {
  if (!moreInfo) return null;

  return (
    <p className="italic">
      <WithConditionsTooltips text={moreInfo} conditions={conditions} />
    </p>
  );
};
