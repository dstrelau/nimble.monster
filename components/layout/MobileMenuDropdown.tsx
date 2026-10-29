import { cn } from "@/lib/utils";

interface MobileMenuDropdownProps {
  isOpen: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const MobileMenuDropdown: React.FC<MobileMenuDropdownProps> = ({
  isOpen,
  className,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        // Keep the last link reachable even with mobile browser toolbars expanded.
        "md:hidden absolute inset-x-0 top-full z-40 bg-header border-t border-white/20 shadow-sm max-h-[calc(100svh-4rem)] overflow-y-auto",
        className
      )}
    >
      <div className="px-4 py-3">{children}</div>
    </div>
  );
};
