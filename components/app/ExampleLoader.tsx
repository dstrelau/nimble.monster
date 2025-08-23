"use client";

import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExampleLoaderProps<T> {
  examples: Record<string, T>;
  onLoadExample: (type: string) => void;
  getIsLegendary?: (example: T) => boolean;
}

export function ExampleLoader<T>({ 
  examples, 
  onLoadExample, 
  getIsLegendary 
}: ExampleLoaderProps<T>) {
  return (
    <div className="flex mb-6 mr-5 justify-end">
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Load Example:</span>
        {Object.keys(examples).map((type) => (
          <Button
            key={type}
            variant="ghost"
            onClick={() => onLoadExample(type)}
          >
            {getIsLegendary?.(examples[type]) && <Crown />}
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}