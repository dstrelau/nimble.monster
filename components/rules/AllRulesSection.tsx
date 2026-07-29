"use client";
import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

interface AllRulesSectionProps {
  /** Initial toggle state, so /rules?homebrew=1 can deep-link into it. */
  defaultShowHomebrew?: boolean;
  children: React.ReactNode;
}

// Homebrew rows are always rendered; the toggle only hides them, so flipping it
// never navigates or moves the scroll position.
export function AllRulesSection({
  defaultShowHomebrew = false,
  children,
}: AllRulesSectionProps) {
  const [showHomebrew, setShowHomebrew] = useState(defaultShowHomebrew);

  return (
    <section id="all-rules" className="mt-10 scroll-mt-20">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">All rules</h2>
        <div className="flex items-center gap-2">
          <Toggle
            variant="outline"
            size="sm"
            pressed={showHomebrew}
            onPressedChange={setShowHomebrew}
          >
            <FlaskConical />
            Include Homebrew
          </Toggle>
        </div>
      </div>
      <div className={cn(!showHomebrew && "[&_[data-homebrew]]:hidden")}>
        {children}
      </div>
    </section>
  );
}
