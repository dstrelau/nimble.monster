"use client";

import { FormSelect } from "@/components/app/Form";
import { useSourcesQuery } from "@/lib/hooks/useSources";
import type { SourceOption } from "@/lib/services/sources/types";
import { cn } from "@/lib/utils";

interface SourceSelectProps {
  source?: { id: string };
  onChange: (source: SourceOption | undefined) => void;
  className?: string;
}

export const SourceSelect: React.FC<SourceSelectProps> = ({
  source,
  onChange,
  className,
}) => {
  const sourcesQuery = useSourcesQuery();

  return (
    <FormSelect
      label="Source"
      name="source"
      className={cn("max-w-sm", className)}
      choices={[
        { value: "none", label: "None" },
        ...(sourcesQuery.data || []).map((s) => ({
          value: s.id,
          label: `${s.name} (${s.abbreviation})`,
        })),
      ]}
      selected={source?.id || "none"}
      onChange={(sourceId) => {
        if (sourceId === "none") {
          onChange(undefined);
        } else {
          const selectedSource = sourcesQuery.data?.find(
            (s) => s.id === sourceId
          );
          onChange(selectedSource);
        }
      }}
    />
  );
};
