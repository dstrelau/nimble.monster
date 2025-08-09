import { Flame } from "lucide-react";
import Link from "next/link";

interface LogoProps {
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  showText = true,
  className = "",
}) => {
  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      <Flame className="h-8 w-8 text-flame hover:fill-flame-fill transition-colors" />
      {showText && (
        <span className="ml-2 font-bold text-header-foreground">
          nimble.monster
        </span>
      )}
    </Link>
  );
};
