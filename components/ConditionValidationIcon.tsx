"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleQuestionMark,
  Ellipsis,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ConditionManagementDialog } from "@/components/ConditionManagementDialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { extractConditions } from "@/lib/conditions";
import { useConditions } from "@/lib/hooks/useConditions";
import { Dialog, DialogTrigger } from "./ui/dialog";

interface ConditionValidationIconProps {
  text: string;
}

export function ConditionValidationIcon({
  text,
}: ConditionValidationIconProps) {
  const { data: session } = useSession();
  const wantConditions = extractConditions(text);

  const { allConditions, ownConds, officialConds } = useConditions({
    enabled: wantConditions.length > 0,
  });

  if (!wantConditions.length) {
    return null;
  }

  let Icon = <Ellipsis className="h-3 w-3 text-muted animate-pulse" />;
  let tooltipText = "";

  if (!ownConds.data && !officialConds.data) {
    Icon = <CircleQuestionMark className="h-3 w-3 text-muted" />;
    tooltipText = "Loading...";
  } else {
    const invalidConditions = wantConditions.filter(
      (want) =>
        !allConditions.some((c) => want.toLowerCase() === c.name.toLowerCase())
    );
    if (!invalidConditions.length) {
      Icon = <CircleCheck className="h-3 w-3 text-success" />;
      tooltipText = "All conditions found";
    } else {
      Icon = <CircleAlert className="h-3 w-3 text-error" />;
      tooltipText =
        invalidConditions.length === 1
          ? `Unknown condition: "${invalidConditions[0]}"`
          : `Unknown conditions: ${invalidConditions.map((c) => `"${c}"`).join(", ")}`;
    }
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>{Icon}</TooltipTrigger>
        <TooltipContent className="max-w-50 text-center">
          <div className="space-y-2">
            <p>{tooltipText}</p>
            {session ? (
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-400"
                >
                  Manage Conditions
                </Button>
              </DialogTrigger>
            ) : (
              <p className="text-muted-foreground">
                Login to define new conditions
              </p>
            )}
          </div>
        </TooltipContent>
        <ConditionManagementDialog />
      </Tooltip>
    </Dialog>
  );
}
