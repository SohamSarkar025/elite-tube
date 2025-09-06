import { categoriesRouter } from '@/modules/categories/server/procedures';
import { createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedures';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedures';
import { subscriptionRouter } from '@/modules/subscriptions/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedures';
// import { commentsRouter } from "@/modules/comments/server/procedures";

export const appRouter = createTRPCRouter({
  studio:studioRouter,
  categories: categoriesRouter,
  videos:videosRouter,
  comments: commentsRouter,
  videoViews:videoViewsRouter,
  videoReactions:videoReactionsRouter,
  subscriptions: subscriptionRouter,
});


// export type definition of API
export type AppRouter = typeof appRouter;