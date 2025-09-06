"use client";

import { CommentForm } from "@/modules/comments/ui/components/comment-form";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface CommentSectionProps {
  videoId: string;
}
export const CommentsSection = ({ videoId }: CommentSectionProps) => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ErrorBoundary fallback={<p>error</p>}>
        <CommentsSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const CommentsSectionSuspense = ({ videoId }: CommentSectionProps) => {
  const [comments] = trpc.comments.getMany.useSuspenseQuery({ videoId });
  return (
    <div className="mt-4">
      <div className="flex flex-col gap-6">
        <h1>0 Comments</h1>
        <CommentForm videoId={videoId} />
      </div>
      {JSON.stringify(comments)}
    </div>
  );
};
