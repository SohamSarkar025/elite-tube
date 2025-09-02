import { db } from "@/db";
import { videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const videosRouter = createTRPCRouter({
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
