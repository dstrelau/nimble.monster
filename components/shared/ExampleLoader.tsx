"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExampleLoaderProps<T> {
  examples: Record<string, T>;
  onLoadExample: (type: string) => void;
  getIcon?: (example: T) => LucideIcon | undefined;
  className?: string;
}

export function ExampleLoader<T>({
  examples,
  onLoadExample,
  getIcon,
  className,
}: ExampleLoaderProps<T>) {
  return (
    <div className={cn("flex mb-6 mr-5 justify-end", className)}>
      <div className="flex items-center">
        <span className="text-sm font-bold mr-2">Load:</span>
        {Object.keys(examples).map((type) => {
          const IconComponent = getIcon?.(examples[type]);
          return (
            <Button
              key={type}
              type="button"
              variant="ghost"
              className="small-caps text-sm"
              onClick={() => onLoadExample(type)}
            >
              {IconComponent && <IconComponent className="h-4 w-4" />}
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
