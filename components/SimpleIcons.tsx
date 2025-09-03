import { siDiscord, siGithub } from "simple-icons";
import { cn } from "@/lib/utils";

export const Discord = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-4", className)}>
    <title>{siDiscord.title}</title>
    <path d={siDiscord.path} />
  </svg>
);

export const GitHub = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-4", className)}>
    <title>{siGithub.title}</title>
    <path d={siGithub.path} />
  </svg>
);
