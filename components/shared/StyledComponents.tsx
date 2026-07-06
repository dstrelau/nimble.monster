import type React from "react";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const InlineConditionsBox: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className={cn("font-sans p-2 bg-muted text-foreground dark:shadow-sm")}>
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
