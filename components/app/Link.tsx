import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface LinkProps extends NextLinkProps {
  children: React.ReactNode;
  className?: string;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <NextLink
        ref={ref}
        className={cn(
          "text-foreground hover:underline underline-offset-2 underline-muted decoration-muted-foreground decoration-2",
          className
        )}
        {...props}
      >
        {children}
      </NextLink>
    );
  }
);

Link.displayName = "Link";

export { Link };
