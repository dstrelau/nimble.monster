import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export const DiscordLoginButton = ({ className }: { className?: string }) => {
  return (
    <Button
      className={cn(
        "px-4 py-6 pr-6  bg-[#5865F2] hover:bg-[#5865F2] text-white font-semibold rounded-lg flex items-center gap-0 transition-colors",
        className
      )}
    >
      <Image
        src="https://cdn.discordapp.com/embed/avatars/0.png"
        alt="Discord"
        width="32"
        height="32"
        className="size-8"
      />
      Login with Discord
    </Button>
  );
};
