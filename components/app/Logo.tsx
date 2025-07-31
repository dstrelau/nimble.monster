import Link from "next/link";
import { Flame } from "lucide-react";

interface LogoProps {
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  showText = true, 
  className = "" 
}) => {
  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      <Flame className="h-8 w-8 text-amber-400 group-hover:text-amber-300 transition-colors" />
      {showText && (
        <span className="ml-2 font-bold text-white">nimble.monster</span>
      )}
    </Link>
  );
};