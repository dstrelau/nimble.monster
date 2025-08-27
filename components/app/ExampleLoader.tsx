"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExampleLoaderProps<T> {
  examples: Record<string, T>;
  onLoadExample: (type: string) => void;
  getIcon?: (example: T) => LucideIcon | undefined;
}

export function ExampleLoader<T>({
  examples,
  onLoadExample,
  getIcon,
}: ExampleLoaderProps<T>) {
  return (
    <div className="flex mb-6 mr-5 justify-end">
      <div className="flex items-center">
        <span className="text-sm font-bold mr-2">Load:</span>
        {Object.keys(examples).map((type) => {
          const IconComponent = getIcon?.(examples[type]);
          return (
            <Button
              key={type}
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
