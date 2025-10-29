"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleQuestionMark,
  Ellipsis,
  Pilcrow,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const FormattingDialog = () => (
  <Dialog>
    <DialogTrigger className="" title="Formatting supported. Click for more.">
      <Pilcrow className="size-4 stroke-muted-foreground hover:stroke-flame" />
    </DialogTrigger>
    <DialogContent className="max-h-[90vh] overflow-y-scroll">
      <DialogHeader>
        <DialogTitle>Formatting</DialogTitle>
      </DialogHeader>
      <DialogDescription>Basic markdown is supported.</DialogDescription>
      <div className="prose prose-neutral dark:prose-invert prose-sm">
        <pre>
          {`**bold** and  _italic_
- lists
- of
- items`}
        </pre>
        <p>Place a full empty line between paragraphs.</p>
        <pre>{`These lines will be\n\nseparate paragraphs.`}</pre>
        <p>
          Conditions can be formatted using double brackets. Official conditions
          are built-in. Custom conditions can be added.
        </p>
        <pre>
          {`On hit: [[Blinded]]\nApply +1 [[Lethargic]]\n[[Taunted|Taunt]] a target`}
        </pre>
        <p>
          Link other monsters, items, etc by using `@` and the ID from the URL:
        </p>
        <pre>
          {`When crit: spawn 1d4 @monster:63pk8wz2yt95sbdx4fhdzm348v\nTakes double damage from @item:1xwsknyv048pz8304bfakpqbb8`}
        </pre>
        <p className="[&_code]:before:content-[''] [&_code]:after:content-['']">
          Dice rolls like <code>1d6+2</code> or <code>2d4av</code> will be
          automatically detected.
        </p>
      </div>
    </DialogContent>
  </Dialog>
);

interface ConditionValidationIconProps {
  text?: string;
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
    return <FormattingDialog />;
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
    <>
      <FormattingDialog />
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
    </>
  );
}
