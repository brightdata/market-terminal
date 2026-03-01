import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    sessionId: v.string(),
    topic: v.string(),
    status: v.string(),
    step: v.string(),
    progress: v.float64(),
    meta: v.any(),
  })
    .index("by_sessionId", ["sessionId"])
    .searchIndex("search_topic", { searchField: "topic" }),

  sessionEvents: defineTable({
    sessionId: v.string(),
    type: v.string(),
    payload: v.any(),
  }).index("by_sessionId", ["sessionId"]),
});
