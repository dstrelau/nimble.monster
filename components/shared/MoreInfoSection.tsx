import type React from "react";
import { FormattedText } from "@/components/shared/FormattedText";
import type { Condition } from "@/lib/types";

interface MoreInfoSectionProps {
  moreInfo?: string;
  conditions: Condition[];
  noInteractive?: boolean;
}

export const MoreInfoSection: React.FC<MoreInfoSectionProps> = ({
  moreInfo,
  conditions,
  noInteractive = false,
}) => {
  if (!moreInfo) return null;

  return (
    <div className="italic">
      <FormattedText
        content={moreInfo}
        conditions={conditions}
        noInteractive={noInteractive}
      />
    </div>
  );
};
