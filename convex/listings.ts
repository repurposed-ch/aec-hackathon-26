import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { listingV } from "./validators";

// Resolves imageStorageId → imageUrl so components always read from imageUrl.
async function resolveImage<T extends { imageStorageId?: string; imageUrl?: string }>(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  doc: T,
): Promise<T & { imageUrl: string | undefined }> {
  if (doc.imageStorageId) {
    const url = await ctx.storage.getUrl(doc.imageStorageId);
    return { ...doc, imageUrl: url ?? doc.imageUrl };
  }
  return doc as T & { imageUrl: string | undefined };
}

export const list = query({
  handler: async (ctx) => {
    const listings = await ctx.db.query("listings").collect();
    return Promise.all(listings.map((l) => resolveImage(ctx, l)));
  },
});

export const getById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, { id }) => {
    const listing = await ctx.db.get(id);
    if (!listing) return null;
    return resolveImage(ctx, listing);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const create = mutation({
  args: { data: listingV },
  handler: async (ctx, { data }) => ctx.db.insert("listings", data),
});

export const update = mutation({
  args: { id: v.id("listings"), data: listingV },
  handler: async (ctx, { id, data }) => {
    await ctx.db.replace(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
