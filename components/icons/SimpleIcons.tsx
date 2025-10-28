import { siDiscord, siGithub } from "simple-icons";
import { cn } from "@/lib/utils";

const defaultClassName = "size-4 stroke-foreground fill-foreground";
export const Discord = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn(defaultClassName, className)}>
    <title>{siDiscord.title}</title>
    <path d={siDiscord.path} />
  </svg>
);

export const GitHub = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn(defaultClassName, className)}>
    <title>{siGithub.title}</title>
    <path d={siGithub.path} />
  </svg>
);
