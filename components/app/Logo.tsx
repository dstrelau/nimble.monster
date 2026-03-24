import Link from "next/link";
import { cn } from "@/lib/utils";
import { Nexus } from "../icons/Nexus";

interface LogoProps {
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  showText = true,
  className = "",
}) => {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center text-flame hover:text-yellow-500 transition-colors",
        className
      )}
    >
      <Nexus className="h-8 w-8" />
      {showText && (
        <span className="ml-2 font-stretch-ultra-condensed font-bold text-header-foreground">
          Nimble Nexus
        </span>
      )}
    </Link>
  );
};
