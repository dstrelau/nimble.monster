"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import clsx from "clsx";
import { Eye, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface BuildViewProps {
  entityName: string;
  previewTitle: string;
  previewContent: ReactNode;
  formContent: ReactNode;
  desktopPreviewContent: ReactNode;
  formClassName?: string;
  previewClassName?: string;
}

export const BuildView: React.FC<BuildViewProps> = ({
  entityName,
  previewTitle,
  previewContent,
  formContent,
  desktopPreviewContent,
  formClassName,
  previewClassName,
}) => {
  return (
    <>
      <Collapsible>
        <CollapsibleTrigger
          className={clsx(
            "md:hidden fixed bottom-0 left-0 right-0 z-1 w-full bg-background flex p-2 justify-between"
          )}
        >
          <span className="font-slab font-black font-small-caps italic text-2xl">
            {entityName}
          </span>
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <Eye className="h-6 w-6" /> Preview
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className={clsx(
              "md:hidden fixed h-full left-0 top-0 inset-0 z-1 bg-background"
            )}
          >
            <div className="w-full flex justify-center items-center sticky bg-secondary text-secondary-foreground p-4">
              <h3 className="font-bold">{previewTitle}</h3>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                >
                  <X className="h-6 w-6" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4">{previewContent}</div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Main Grid Layout */}
      <div className={clsx("grid grid-cols-6 gap-x-8 mb-10 md:mb-0")}>
        {/* Form Section */}
        <div className={clsx("col-span-6", formClassName)}>{formContent}</div>

        {/* Desktop Preview Section */}
        <div className={clsx("hidden md:block", previewClassName)}>
          <div className="sticky top-4">{desktopPreviewContent}</div>
        </div>
      </div>
    </>
  );
};
