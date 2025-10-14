"use client";

import { planet } from "@lucide/lab";
import { Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSiteName } from "@/lib/utils/branding";

interface LogoProps {
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  showText = true,
  className = "",
}) => {
  const [siteName, setSiteName] = useState("Nimble Nexus");

  useEffect(() => {
    setSiteName(getSiteName(window.location.hostname));
  }, []);

  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      <Icon
        iconNode={planet}
        className="h-8 w-8 text-flame hover:fill-flame-fill transition-colors"
      />
      {showText && (
        <span className="ml-2 font-bold text-header-foreground">
          {siteName}
        </span>
      )}
    </Link>
  );
};
