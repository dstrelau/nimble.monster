"use client";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "@/app/%5Factions/signIn/contract";
import { call } from "@/lib/contract";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export const DiscordLoginButton = ({ className }: { className?: string }) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const handleSignIn = async () => {
    setPending(true);
    setError(false);
    try {
      const { url } = await call(signIn, {});
      window.location.assign(url);
    } catch {
      setError(true);
      setPending(false);
    }
  };
  return (
    <div className="relative">
      <Button
        type="button"
        onClick={handleSignIn}
        disabled={pending}
        aria-busy={pending}
        className={cn(
          "px-4 py-6 bg-[#5865F2] hover:bg-[#5865F2] text-white font-semibold rounded-lg flex items-center gap-0 transition-colors",
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
      {error && (
        <p
          role="alert"
          className="absolute top-full left-0 w-max max-w-72 text-destructive text-sm"
        >
          Unable to start sign-in. Please try again.
        </p>
      )}
    </div>
  );
};
