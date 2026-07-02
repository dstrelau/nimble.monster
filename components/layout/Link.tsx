import { ExternalLink } from "lucide-react";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface LinkProps extends NextLinkProps {
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, className, external, ...props }, ref) => {
    return (
      <NextLink
        ref={ref}
        className={cn(
          "text-foreground hover:underline underline-offset-2 underline-muted decoration-muted-foreground decoration-2",
          external && "inline-flex items-center gap-1",
          className
        )}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        {...props}
      >
        {children}
        {external && <ExternalLink className="size-3" />}
      </NextLink>
    );
  }
);

Link.displayName = "Link";

export { Link };
