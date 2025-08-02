import Link from "next/link";
import { cn } from "@/lib/utils";

interface MobileMenuLink {
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

interface MobileMenuButton {
  label: string;
  onClick: () => void;
}

interface MobileMenuDropdownProps {
  isOpen: boolean;
  links?: MobileMenuLink[];
  buttons?: MobileMenuButton[];
  className?: string;
}

export const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({
  isOpen,
  links = [],
  buttons = [],
  className = "",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn("md:hidden border-t border-white/20 bg-blue", className)}
    >
      <div className="px-4 py-2 space-y-1">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className={cn(
              "block px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors",
              link.isActive && "font-bold bg-white/20"
            )}
            onClick={link.onClick}
          >
            {link.label}
          </Link>
        ))}
        {buttons.map((button, index) => (
          <button
            key={index}
            type="button"
            className="block w-full text-left px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors"
            onClick={button.onClick}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};
