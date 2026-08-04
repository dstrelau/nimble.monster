import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  BookOpen,
  Info,
  Lightbulb,
  TriangleAlert,
} from "lucide-react";
import type { AdventureNodePresentation } from "@/lib/db/schema";

export type AdventureCalloutPresentation = Exclude<
  AdventureNodePresentation,
  "rules"
>;

export interface AdventureCalloutPresentationConfig {
  value: AdventureCalloutPresentation;
  label: string;
  Icon: LucideIcon;
  panelClassName: string;
  accentClassName: string;
  badgeClassName: string;
  pillClassName: string;
  ruleClassName: string;
  decorationClassName: string;
}

const presentationByValue = {
  note: {
    value: "note",
    label: "Note",
    Icon: Info,
    panelClassName:
      "border-[#dfd2b9] border-l-[#9a845f] bg-[#f8f1e4] text-[#4b4032] dark:border-[#5c4d38] dark:border-l-[#b09a70] dark:bg-[#30291f] dark:text-[#eadfc9]",
    accentClassName: "text-[#8d754c] dark:text-[#d0b98a]",
    badgeClassName:
      "bg-[#8d754c] text-[#fff9ec] dark:bg-[#b09a70] dark:text-[#2a2118]",
    pillClassName:
      "border-[#dfd2b9] text-[#8d754c] hover:bg-[#f8f1e4] data-[state=on]:border-[#8d754c] data-[state=on]:bg-[#8d754c] data-[state=on]:text-white dark:border-[#5c4d38] dark:text-[#d0b98a] dark:hover:bg-[#3a3023] dark:data-[state=on]:border-[#b09a70] dark:data-[state=on]:bg-[#b09a70] dark:data-[state=on]:text-[#2a2118]",
    ruleClassName: "bg-[#dfd2b9] dark:bg-[#5c4d38]",
    decorationClassName:
      "border-[#dfd2b9] bg-[#efe5d2] dark:border-[#5c4d38] dark:bg-[#3b3022]",
  },
  "read-aloud": {
    value: "read-aloud",
    label: "Read Aloud",
    Icon: BookOpen,
    panelClassName:
      "border-[#c6dfe4] border-l-[#4e8190] bg-[#edf5f6] text-[#27434b] dark:border-[#37545b] dark:border-l-[#74b7c6] dark:bg-[#1e3034] dark:text-[#d7edf0]",
    accentClassName: "text-[#397789] dark:text-[#8bc4d0]",
    badgeClassName:
      "bg-[#397789] text-[#f0fbfc] dark:bg-[#74b7c6] dark:text-[#193036]",
    pillClassName:
      "border-[#c6dfe4] text-[#397789] hover:bg-[#edf5f6] data-[state=on]:border-[#397789] data-[state=on]:bg-[#397789] data-[state=on]:text-white dark:border-[#37545b] dark:text-[#8bc4d0] dark:hover:bg-[#263d42] dark:data-[state=on]:border-[#74b7c6] dark:data-[state=on]:bg-[#74b7c6] dark:data-[state=on]:text-[#193036]",
    ruleClassName: "bg-[#c6dfe4] dark:bg-[#37545b]",
    decorationClassName:
      "border-[#c6dfe4] bg-[#dcecef] dark:border-[#37545b] dark:bg-[#294348]",
  },
  warning: {
    value: "warning",
    label: "Warning",
    Icon: TriangleAlert,
    panelClassName:
      "border-[#efc8bd] border-l-[#bd4937] bg-[#fff0eb] text-[#5e2d26] dark:border-[#65372e] dark:border-l-[#dd6a54] dark:bg-[#3c221f] dark:text-[#f7d6ce]",
    accentClassName: "text-[#b33b2b] dark:text-[#f08b73]",
    badgeClassName:
      "bg-[#b33b2b] text-[#fff8f5] dark:bg-[#dd6a54] dark:text-[#351917]",
    pillClassName:
      "border-[#efc8bd] text-[#b33b2b] hover:bg-[#fff0eb] data-[state=on]:border-[#b33b2b] data-[state=on]:bg-[#b33b2b] data-[state=on]:text-white dark:border-[#65372e] dark:text-[#f08b73] dark:hover:bg-[#4d2925] dark:data-[state=on]:border-[#dd6a54] dark:data-[state=on]:bg-[#dd6a54] dark:data-[state=on]:text-[#351917]",
    ruleClassName: "bg-[#efc8bd] dark:bg-[#65372e]",
    decorationClassName:
      "border-[#efc8bd] bg-[#f9ddd5] dark:border-[#65372e] dark:bg-[#522b27]",
  },
  tip: {
    value: "tip",
    label: "GM Tip",
    Icon: Lightbulb,
    panelClassName:
      "border-[#d3e2c5] border-l-[#6a8e58] bg-[#f2f7ed] text-[#3f5537] dark:border-[#3d5636] dark:border-l-[#93ba79] dark:bg-[#243122] dark:text-[#e2efda]",
    accentClassName: "text-[#5d854c] dark:text-[#a9cf8f]",
    badgeClassName:
      "bg-[#5d854c] text-[#f7fcf3] dark:bg-[#93ba79] dark:text-[#1e2a1b]",
    pillClassName:
      "border-[#d3e2c5] text-[#5d854c] hover:bg-[#f2f7ed] data-[state=on]:border-[#5d854c] data-[state=on]:bg-[#5d854c] data-[state=on]:text-white dark:border-[#3d5636] dark:text-[#a9cf8f] dark:hover:bg-[#30432b] dark:data-[state=on]:border-[#93ba79] dark:data-[state=on]:bg-[#93ba79] dark:data-[state=on]:text-[#1e2a1b]",
    ruleClassName: "bg-[#d3e2c5] dark:bg-[#3d5636]",
    decorationClassName:
      "border-[#d3e2c5] bg-[#e5efd9] dark:border-[#3d5636] dark:bg-[#30432b]",
  },
  optional: {
    value: "optional",
    label: "Optional",
    Icon: Bookmark,
    panelClassName:
      "border-[#dfcdf3] border-l-[#7f4fc1] bg-[#f6f0fe] text-[#4e356d] dark:border-[#553c73] dark:border-l-[#ae83df] dark:bg-[#2d213d] dark:text-[#eadcfa]",
    accentClassName: "text-[#7543b7] dark:text-[#bd99e8]",
    badgeClassName:
      "bg-[#7543b7] text-[#fbf8ff] dark:bg-[#ae83df] dark:text-[#271837]",
    pillClassName:
      "border-[#dfcdf3] text-[#7543b7] hover:bg-[#f6f0fe] data-[state=on]:border-[#7543b7] data-[state=on]:bg-[#7543b7] data-[state=on]:text-white dark:border-[#553c73] dark:text-[#bd99e8] dark:hover:bg-[#3b2a50] dark:data-[state=on]:border-[#ae83df] dark:data-[state=on]:bg-[#ae83df] dark:data-[state=on]:text-[#271837]",
    ruleClassName: "bg-[#dfcdf3] dark:bg-[#553c73]",
    decorationClassName:
      "border-[#dfcdf3] bg-[#eadcf8] dark:border-[#553c73] dark:bg-[#3b2a50]",
  },
} satisfies Record<
  AdventureCalloutPresentation,
  AdventureCalloutPresentationConfig
>;

export const ADVENTURE_CALLOUT_PRESENTATIONS = [
  presentationByValue.note,
  presentationByValue["read-aloud"],
  presentationByValue.warning,
  presentationByValue.tip,
  presentationByValue.optional,
];

const presentationValues = new Set<string>(
  ADVENTURE_CALLOUT_PRESENTATIONS.map(({ value }) => value)
);

export function isAdventureCalloutPresentation(
  value: string
): value is AdventureCalloutPresentation {
  return presentationValues.has(value);
}

export function normalizeAdventureCalloutPresentation(
  presentation: AdventureNodePresentation | null | undefined
): AdventureCalloutPresentation {
  switch (presentation) {
    case "read-aloud":
    case "optional":
    case "tip":
    case "warning":
    case "note":
      return presentation;
    default:
      return "note";
  }
}

export function getAdventureCalloutPresentation(
  presentation: AdventureNodePresentation | null | undefined
): AdventureCalloutPresentationConfig {
  return presentationByValue[
    normalizeAdventureCalloutPresentation(presentation)
  ];
}
