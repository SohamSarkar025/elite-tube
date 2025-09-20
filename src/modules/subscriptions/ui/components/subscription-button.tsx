import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubscriptionButtonProps {
  onClick: ButtonProps["onClick"];
  isSubscribed: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  size?: ButtonProps["size"];
}

export const SubscriptionButton = ({
  onClick,
  isSubscribed,
  disabled = false,
  isLoading = false,
  className,
  size,
}: SubscriptionButtonProps) => {
  return (
    <Button
      type="button"
      size={size}
      variant={isSubscribed ? "secondary" : "default"}
      className={cn("rounded-full", className)}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        "Unsubscribe"
      ) : (
        "Subscribe"
      )}
    </Button>
  );
};
