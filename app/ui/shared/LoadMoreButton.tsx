import { Button } from "@/components/ui/button";

interface LoadMoreButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onClick,
  disabled,
}) => {
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        className="min-w-2xs"
        onClick={onClick}
        disabled={disabled}
      >
        Load More
      </Button>
    </div>
  );
};
