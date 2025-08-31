import {db} from "@/db"
import { categories } from "@/db/schema"
import { baseProcedure, createTRPCRouter } from "@/trpc/init"
import { TRPCError } from "@trpc/server";

export const categoriesRouter = createTRPCRouter({
    getMany: baseProcedure.query(async ()=> {

        // throw new TRPCError({ code:"BAD_REQUEST"})
        const data = await db.select().from(categories);

        return data;
    }),
});