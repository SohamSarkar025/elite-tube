import { db } from "@/db";
import { users, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod"


export const videosRouter = createTRPCRouter({
  getOne:baseProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(async ({ input}) => {
     const [ existingVideo ] = await db
      .select({
        ...getTableColumns(videos),
        user: {
          ...getTableColumns(users),
        },
        viewCount:db.$count(videoViews,eq(videoViews.videoId,videos.id))
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .where(eq(videos.id, input.id))
      
      if(!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }

      return existingVideo;
  }),



  restoreThumbnail: protectedProcedure
  .input(z.object({id:z.string().uuid() }))
  .mutation(async({ctx,input})=>{
    const { id: userId } = ctx.user;
    const [existingVideo]=await db
    .select()
    .from(videos)
    .where(and(
      eq(videos.id,input.id),
      eq(videos.userId,userId),
    ));
    if(!existingVideo){
      throw new TRPCError({code:"NOT_FOUND"});
    }

    if(existingVideo.thumbnailKey){
    const utapi=new UTApi();

    await utapi.deleteFiles(existingVideo.thumbnailKey);
    await db
    .update(videos)
    .set({thumbnailKey:null,thumbnailUrl:null})
    .where(and(
    eq(videos.id,input.id),
    eq(videos.userId,userId),
    ))
    }

    if(!existingVideo.muxPlaybackId){
      throw new TRPCError({code:"BAD_REQUEST"});
    }

    const utapi=new UTApi();
    const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;

    const uploadedThumbnail=await utapi.uploadFilesFromUrl(tempThumbnailUrl);

    if(!uploadedThumbnail.data){
      throw new TRPCError({code:"INTERNAL_SERVER_ERROR"});
    }

    const {key:thumbnailKey,url:thumbnailUrl}=uploadedThumbnail.data;

    const [updatedVideo]=await db
    .update(videos)
    .set({thumbnailUrl,thumbnailKey})
    .where(and(
      eq(videos.id,input.id),
      eq(videos.userId,userId)
    ))
    .returning();

    return updatedVideo;
  }),
  remove: protectedProcedure
  .input(z.object({id:z.string().uuid() }))
  .mutation(async ({ ctx, input}) => {
    const { id: userId } = ctx.user;

    const [ removeVideo] = await db
    .delete(videos)
    .where(and(
      eq(videos.id, input.id),
      eq(videos.userId, userId)
    ))
    .returning()

    if(!removeVideo) {
      throw new TRPCError({ code: "NOT_FOUND"})
    }

    return removeVideo;
  }),
  update: protectedProcedure
  .input(videoUpdateSchema)
  .mutation(async ({ ctx,input}) => {
    const { id: userId } = ctx.user;

    if(!input.id) {
      throw new TRPCError({ code:"BAD_REQUEST"})
    }
    const [updatedVideo ] = await db
    .update(videos)
    .set({
      title:input.title,
      description: input.description,
      categoryId:input.categoryId,
      visibility: input.visibility,
      updatedAt:new Date(),
    })
    .where(and(
      eq(videos.id, input.id),
      eq(videos.userId, userId)
    ))
    .returning();

    if(!updatedVideo) {
      throw new TRPCError({ code: "NOT_FOUND"})
    }

    return updatedVideo;
  }),

  create: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // 1️⃣ Check user authentication
      if (!ctx.user?.id) {
        console.error("❌ No authenticated user found in ctx.user");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a video.",
        });
      }

      const userId = ctx.user.id;
      console.log("Creating video for user:", userId);

      // 2️⃣ Create Mux upload
      let upload;
      try {
        upload = await mux.video.uploads.create({
          new_asset_settings: {
            passthrough: userId,
            playback_policy: ["public"],
            input:[
            {
              generated_subtitles: [
                {
                  language_code:"en",
                  name:"English"
                },
              ],
            },
            ],
          },
          cors_origin: "*", // TODO: Use your production domain
        });
        console.log("Mux upload created:", upload.id);
      } catch (muxError) {
        console.error("❌ Mux upload failed:", muxError);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create Mux upload",
          cause: muxError,
        });
      }

      // 3️⃣ Insert video record in DB
      let video;
      try {
        [video] = await db.insert(videos)
          .values({
            userId,
            title: "Untitled",
            muxStatus: "waiting",
            muxUploadId: upload.id,
          })
          .returning();
        console.log("Video inserted into DB:", video.id);
      } catch (dbError: any) {
        console.error("❌ DB insert failed:", dbError);

        if (dbError.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A video with this upload already exists.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create video in DB",
          cause: dbError,
        });
      }

      // 4️⃣ Return the video and upload URL
      return { video, url: upload.url };
    } catch (error) {
      console.error("❌ Video creation procedure failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Video creation failed",
        cause: error,
      });
    }
  }),
});
