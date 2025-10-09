"use client";
import { useEffect, useRef } from "react";
import { Card as MonsterCard } from "@/app/ui/monster/Card";
import type { Monster } from "@/lib/services/monsters";
import { cn } from "@/lib/utils";

interface MonsterCardWithOverflowProps {
  monster: Monster;
}

export function MonsterCardWithOverflow({
  monster,
}: MonsterCardWithOverflowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;

    if (!container || !card) return;

    const checkOverflow = () => {
      const isOverflowing = card.scrollHeight > container.clientHeight;
      container.classList.toggle("overflow", isOverflowing);
    };

    checkOverflow();

    // Check again after images load or content changes
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(card);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative max-h-[450px] overflow-hidden p-2 group"
    >
      <div ref={cardRef}>
        <MonsterCard monster={monster} hideActions={true} />
      </div>
      <div
        className={cn(
          "absolute z-10 bottom-0 left-0 right-0 h-8",
          "border-b border-gray-200 dark:border-gray-700",
          "bg-gradient-to-t from-background to-transparent pointer-events-none opacity-0",
          "group-[.overflow]:opacity-100 transition-opacity"
        )}
      ></div>
    </div>
  );
}
