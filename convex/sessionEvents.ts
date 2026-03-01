import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const insert = mutation({
  args: {
    sessionId: v.string(),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessionEvents", args);
  },
});

export const insertBatch = mutation({
  args: {
    events: v.array(
      v.object({
        sessionId: v.string(),
        type: v.string(),
        payload: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const ev of args.events) {
      await ctx.db.insert("sessionEvents", ev);
    }
  },
});

export const list = query({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessionEvents")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .take((args.limit ?? 250) as number);
  },
});
