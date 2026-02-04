"use client";

import { Moon, Scroll, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  className?: string;
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className} />;
  }

  return (
    <ToggleGroup type="single" value={theme} className={cn(className)}>
      <ToggleGroupItem
        value="light"
        onClick={() =>
          theme === "light" ? setTheme("system") : setTheme("light")
        }
      >
        <Sun />
        <span className="sr-only">Light</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        onClick={() =>
          theme === "dark" ? setTheme("system") : setTheme("dark")
        }
      >
        <Moon />
        <span className="sr-only">Dark</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="parchment"
        onClick={() =>
          theme === "parchment" ? setTheme("system") : setTheme("parchment")
        }
      >
        <Scroll />
        <span className="sr-only">Parchment</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
