import { useClerk } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

interface UseSubscriptionProps {
  userId: string;
  isSubscribed: boolean;
  fromVideoId?: string;
  onSuccess?: (newStatus: boolean) => void;
}

export const useSubscription = ({
  userId,
  isSubscribed,
  fromVideoId,
  onSuccess,
}: UseSubscriptionProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const subscribe = trpc.subscriptions.create.useMutation({
    onSuccess: (res) => {
      toast.success("Subscribed");
      utils.videos.getManySubscribed.invalidate();
      if (fromVideoId) utils.videos.getOne.invalidate({ id: fromVideoId });
    //   utils.users.getOne.invalidate({ id: userId }); // ✅ refresh use
      onSuccess?.(res.isSubscribed);
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
    },
  });

  const unsubscribe = trpc.subscriptions.remove.useMutation({
    onSuccess: (res) => {
      toast.success("Unsubscribed");
      utils.videos.getManySubscribed.invalidate();
      if (fromVideoId) utils.videos.getOne.invalidate({ id: fromVideoId });
    //   utils.users.getOne.invalidate({ id: userId }); // ✅ refresh user
      onSuccess?.(res.isSubscribed);
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong");
      if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
    },
  });

  const isPending = subscribe.isPending || unsubscribe.isPending;

  const onClick = () => {
    if (isSubscribed) {
      unsubscribe.mutate({ userId });
    } else {
      subscribe.mutate({ userId });
    }
  };

  return {
    isPending,
    onClick,
  };
};
