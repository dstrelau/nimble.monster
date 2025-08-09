import { TriangleAlert } from "lucide-react";
import Link from "next/link";

export function DevBanner() {
  return (
    <div className="w-full bg-warning text-warning-foreground">
      <div className="mx-auto px-4 py-2 flex items-center justify-center gap-2 max-w-7xl">
        <TriangleAlert className="h-10 w-10 flex-shrink-0" />
        <div className="text-sm">
          You are using the "next" version, which is undergoing heavy
          development. For the time being, any data updated here will not be
          reflected in the main{" "}
          <Link
            href="https://nimble.monster"
            className="underline font-semibold"
          >
            nimble.monster
          </Link>{" "}
          site and WILL BE LOST when these changes go live. Only use this
          version of the site for testing new functionality.
        </div>
      </div>
    </div>
  );
}
