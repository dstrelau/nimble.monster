import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ className }) => {
  return (
    <div className={className ?? "text-center py-12"}>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
};

interface ErrorStateProps {
  message: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  className,
}) => {
  return (
    <div className={className ?? "text-center py-12"}>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

interface EmptyStateProps {
  entityName: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  entityName,
  className,
}) => {
  return (
    <div
      className={className ?? "col-span-4 text-center text-muted-foreground"}
    >
      No {entityName} found.
    </div>
  );
};

interface CreateEmptyStateProps {
  href: string;
  entityName: string;
}

export function CreateEmptyState({ href, entityName }: CreateEmptyStateProps) {
  return (
    <div className="col-span-full flex justify-center py-12">
      <Button
        asChild
        size="lg"
        className="h-14 bg-flame px-8 text-lg text-black hover:bg-flame/90 has-[>svg]:px-8"
      >
        <Link href={href}>
          <Plus className="size-5" />
          Create {entityName}
        </Link>
      </Button>
    </div>
  );
}
