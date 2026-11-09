import { defineSchema, defineTable } from "convex/server";
import { listingV } from "./validators";

export default defineSchema({
  listings: defineTable(listingV)
    .index("by_category", ["category"])
    .index("by_type", ["type"]),
});
