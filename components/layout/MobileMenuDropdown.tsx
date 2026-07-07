import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileMenuLink {
  href: string;
  label: string;
  icon?: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  isActive?: boolean;
  onClick?: () => void;
  variant?: "button";
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
    <div
      className={cn(
        "md:hidden absolute inset-x-0 top-full z-40 bg-header border-t border-white/20 shadow-sm",
        className
      )}
    >
      <div className="px-4 py-2 space-y-1">
        {links.map((link) =>
          link.variant === "button" ? (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "w-full justify-start gap-2 mb-1"
              )}
              onClick={link.onClick}
            >
              {link.icon && <link.icon className="h-4 w-4 shrink-0" />}
              {link.label}
            </Link>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-foreground hover:bg-white/10 transition-colors",
                link.isActive && "font-bold bg-accent"
              )}
              onClick={link.onClick}
            >
              {link.icon && <link.icon className="h-4 w-4 shrink-0" />}
              {link.label}
            </Link>
          )
        )}
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
