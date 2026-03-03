import type * as React from "react";
import { cn } from "@/lib/utils";

function InputGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("relative flex items-center", className)} {...props}>
      {children}
    </div>
  );
}

function InputGroupPrefix({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-2 flex items-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { InputGroup, InputGroupPrefix };
