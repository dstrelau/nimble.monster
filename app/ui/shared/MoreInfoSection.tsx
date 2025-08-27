import type React from "react";
import { FormattedText } from "@/components/FormattedText";
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
    <div className="italic">
      <FormattedText content={moreInfo} conditions={conditions} />
    </div>
  );
};
