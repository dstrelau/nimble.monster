"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HashHighlightProps {
  id: string;
  children: React.ReactNode;
}

export function HashHighlight({ id, children }: HashHighlightProps) {
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    function check() {
      setHighlighted(window.location.hash === `#${id}`);
    }

    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [id]);

  return (
    <div
      className={cn(
        "transition-colors duration-700 -mx-3 px-3 rounded",
        highlighted && "bg-flame/30"
      )}
    >
      {children}
    </div>
  );
}
