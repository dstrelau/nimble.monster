"use client";

import clsx from "clsx";
import { Eye, X } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface BuildViewProps {
  showMobilePreview: boolean;
  setShowMobilePreview: (show: boolean) => void;
  entityName: string;
  previewTitle: string;
  previewContent: ReactNode;
  formContent: ReactNode;
  desktopPreviewContent: ReactNode;
  formClassName?: string;
  previewClassName?: string;
}

export const BuildView: React.FC<BuildViewProps> = ({
  showMobilePreview,
  setShowMobilePreview,
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
      {/* Mobile Preview Overlay */}
      <div
        className={clsx(
          showMobilePreview || "hidden",
          "md:hidden fixed h-full left-0 top-0 inset-0 z-1 bg-background"
        )}
      >
        <div className="w-full flex justify-center items-center sticky bg-secondary text-secondary-foreground p-4">
          <h3 className="font-bold">{previewTitle}</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowMobilePreview(false)}
            className="ml-auto"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4">
          {previewContent}
        </div>
      </div>

      {/* Mobile Preview Toggle Bar */}
      <div
        className={clsx(
          "md:hidden fixed bottom-0 left-0 right-0 z-1 w-full bg-background flex p-2 justify-between",
          showMobilePreview && "hidden"
        )}
        onClick={() => setShowMobilePreview(true)}
      >
        <span className="font-slab font-black font-small-caps italic text-2xl">
          {entityName}
        </span>
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          <Eye className="h-6 w-6" /> Preview
        </div>
      </div>

      {/* Main Grid Layout */}
      <div
        className={clsx(
          "grid grid-cols-6 gap-x-8 mb-10 md:mb-0",
          showMobilePreview && "hidden"
        )}
      >
        {/* Form Section */}
        <div className={clsx("col-span-6", formClassName)}>
          {formContent}
        </div>

        {/* Desktop Preview Section */}
        <div className={clsx("hidden md:block", previewClassName)}>
          <div className="sticky top-4">
            {desktopPreviewContent}
          </div>
        </div>
      </div>
    </>
  );
};