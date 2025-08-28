import Link from "next/link";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./ModeToggle";

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
  children?: React.ReactNode;
}

export const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({
  isOpen,
  links = [],
  buttons = [],
  className = "",
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className={cn("md:hidden border-t border-white/20", className)}>
      <div className="px-4 py-2 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block px-3 py-2 rounded-md text-foreground hover:bg-white/10 transition-colors",
              link.isActive && "font-bold bg-accent"
            )}
            onClick={link.onClick}
          >
            {link.label}
          </Link>
        ))}
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            className="block w-full text-left px-3 py-2 rounded-md text-foreground hover:bg-white/10 transition-colors"
            onClick={button.onClick}
          >
            {button.label}
          </button>
        ))}
        {children}
      </div>
    </div>
  );
};
