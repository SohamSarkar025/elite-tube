import { useState } from "react";
import Link from "next/link";
import { VideoGetOneOutput } from "../../types";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { SubscriptionButton } from "@/modules/subscriptions/ui/components/subscription-button";
import { UserInfo } from "@/modules/users/ui/components/user-info";
import { useSubscription } from "@/modules/subscriptions/hooks/use-subscription";

interface VideoOwnerProps {
  user: VideoGetOneOutput["user"];
  videoId: string;
}

export const VideoOwner = ({ user, videoId }: VideoOwnerProps) => {
  const { userId: clerkUserId, isLoaded } = useAuth();

  // Optimistic local state for subscription status
  const [isSubscribed, setIsSubscribed] = useState(user.viewerSubscribed);

  const { isPending, onClick } = useSubscription({
    userId: user.id,
    isSubscribed,
    fromVideoId: videoId,
    onSuccess: (newStatus: boolean) => {
      setIsSubscribed(newStatus); // ensure state stays in sync after backend confirms
    },
  });

  return (
    <div className="flex items-center sm:items-start justify-between sm:justify-start gap-3 min-w-0">
      {/* User Info */}
      <Link href={`/users/${user.id}`}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />
          <div className="flex flex-col gap-1 min-w-0">
            <UserInfo size="lg" name={user.name} />
            <span className="text-sm text-muted-foreground line-clamp-1">
              {user.subscriberCount} subscribers
            </span>
          </div>
        </div>
      </Link>

      {/* Button: Edit if owner, Subscribe/Unsubscribe otherwise */}
      {clerkUserId === user.clerkId ? (
        <Button className="rounded-full" asChild variant="secondary">
          <Link href={`/studio/videos/${videoId}`}>Edit Video</Link>
        </Button>
      ) : (
        <SubscriptionButton
          onClick={() => {
            setIsSubscribed(!isSubscribed); // toggle immediately for smooth UX
            onClick(); // trigger backend mutation
          }}
          disabled={isPending || !isLoaded}
          isSubscribed={isSubscribed}
          className="flex-none"
        />
      )}
    </div>
  );
};
