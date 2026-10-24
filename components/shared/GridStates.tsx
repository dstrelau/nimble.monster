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
