import type React from "react";
import { CardContent, Card as ShadcnCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const InlineConditionsBox: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    className={cn(
      "font-sans p-2 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-sm"
    )}
  >
    {children}
  </div>
);

export const CardContentWithGap: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <CardContent className={`flex flex-col gap-4 ${className}`}>
    {children}
  </CardContent>
);

export const CardContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <ShadcnCard className={cn("gap-4 py-4", className)}>{children}</ShadcnCard>
);
