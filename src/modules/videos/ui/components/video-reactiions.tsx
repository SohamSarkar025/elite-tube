import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";

import { VideoGetOneOutput } from "../../types";
import { useClerk } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useState } from "react";

interface VideoReactionsProps {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: VideoGetOneOutput["viewerReaction"];
}

export const VideoReactions = ({
  videoId,
  likes,
  dislikes,
  viewerReaction,
}: VideoReactionsProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  // Local optimistic state
  const [localLikes, setLocalLikes] = useState(likes);
  const [localDislikes, setLocalDislikes] = useState(dislikes);
  const [localReaction, setLocalReaction] =
    useState<VideoGetOneOutput["viewerReaction"]>(viewerReaction);

  const handleOptimisticUpdate = (reaction: "like" | "dislike") => {
    if (reaction === "like") {
      if (localReaction === "like") {
        // undo like
        setLocalLikes((c) => c - 1);
        setLocalReaction(null);
      } else {
        setLocalLikes((c) => c + 1);
        if (localReaction === "dislike") setLocalDislikes((c) => c - 1);
        setLocalReaction("like");
      }
    } else {
      if (localReaction === "dislike") {
        // undo dislike
        setLocalDislikes((c) => c - 1);
        setLocalReaction(null);
      } else {
        setLocalDislikes((c) => c + 1);
        if (localReaction === "like") setLocalLikes((c) => c - 1);
        setLocalReaction("dislike");
      }
    }
  };

  const like = trpc.videoReactions.like.useMutation({
    onMutate: async () => {
      const prev = { localLikes, localDislikes, localReaction };
      handleOptimisticUpdate("like");
      return { prev };
    },
    onError: (error, _vars, context) => {
      toast.error("Something Went Wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
      if (context?.prev) {
        setLocalLikes(context.prev.localLikes);
        setLocalDislikes(context.prev.localDislikes);
        setLocalReaction(context.prev.localReaction);
      }
    },
    onSettled: () => {
      utils.videos.getOne.invalidate({ id: videoId });
    },
  });

  const dislike = trpc.videoReactions.dislike.useMutation({
    onMutate: async () => {
      const prev = { localLikes, localDislikes, localReaction };
      handleOptimisticUpdate("dislike");
      return { prev };
    },
    onError: (error, _vars, context) => {
      toast.error("Something Went Wrong");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
      if (context?.prev) {
        setLocalLikes(context.prev.localLikes);
        setLocalDislikes(context.prev.localDislikes);
        setLocalReaction(context.prev.localReaction);
      }
    },
    onSettled: () => {
      utils.videos.getOne.invalidate({ id: videoId });
    },
  });

  return (
    <div className="flex items-center flex-none">
      {/* Like Button */}
      <Button
        onClick={() => like.mutate({ videoId })}
        disabled={like.isPending || dislike.isPending}
        className="rounded-l-full rounded-r-none gap-2 pr-4"
        variant="secondary"
        aria-pressed={localReaction === "like"}
        aria-label="Like this video"
      >
        <ThumbsUpIcon
          className={cn(
            "size-5 transition-colors",
            localReaction === "like"
              ? "fill-current text-primary stroke-primary"
              : "fill-none text-muted-foreground stroke-current"
          )}
          fill={localReaction === "like" ? "currentColor" : "none"}
        />
        {localLikes}
      </Button>

      <Separator orientation="vertical" className="h-7" />

      {/* Dislike Button */}
      <Button
        onClick={() => dislike.mutate({ videoId })}
        disabled={like.isPending || dislike.isPending}
        className="rounded-r-full rounded-l-none pl-3"
        variant="secondary"
        aria-pressed={localReaction === "dislike"}
        aria-label="Dislike this video"
      >
        <ThumbsDownIcon
          className={cn(
            "size-5 transition-colors",
            localReaction === "dislike"
              ? "fill-current text-primary stroke-primary"
              : "fill-none text-muted-foreground stroke-current"
          )}
          fill={localReaction === "dislike" ? "currentColor" : "none"}
        />
        {localDislikes}
      </Button>
    </div>
  );
};
