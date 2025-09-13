"use client";

import { Code, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function DevBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [colorClass, setColorClass] = useState(
    "bg-warning text-warning-foreground"
  );
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;

    if (hostname === "nimble.monster") {
      setIsVisible(false);
    } else {
      setIsVisible(true);
      if (hostname === "localhost") {
        setColorClass("bg-error/50 text-error-foreground");
        setIsLocalhost(true);
      } else {
        setColorClass("bg-warning/50 text-warning-foreground");
        setIsLocalhost(false);
      }
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`w-full fixed bottom-0 z-50 ${colorClass}`}>
      <div className="mx-auto px-4 py-4 flex items-center justify-center gap-2 max-w-7xl">
        {isLocalhost ? (
          <Code className="h-10 w-10 flex-shrink-0" />
        ) : (
          <TriangleAlert className="h-10 w-10 flex-shrink-0" />
        )}
        <div className="text-sm">
          {isLocalhost ? (
            "Development"
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
