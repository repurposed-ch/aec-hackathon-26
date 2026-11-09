import { v, type VLiteral, type VUnion } from "convex/values";

// ── Enum values (single source of truth for backend and frontend) ─────────────

export const WOOD_TYPES = ["cedar", "oak", "pine", "douglas fir", "spruce"] as const;
export const BRICK_COLOURS = ["red", "yellow", "brown"] as const;
export const TILE_COLOURS = ["red", "yellow", "blue", "white", "brown", "green"] as const;
export const TILE_TYPES = ["ceramic", "slate", "terracota"] as const;
export const WINDOW_TYPES = ["fixed", "sliding", "casement", "awning"] as const;
export const DOOR_TYPES = ["interior", "exterior", "sliding", "french"] as const;
export const DOOR_MATERIALS = ["wood", "steel", "aluminum", "upvc"] as const;

/** `v.union` of `v.literal`s for every value in the list. */
function literals<const T extends readonly string[]>(values: T) {
  return v.union(...values.map((value) => v.literal(value))) as unknown as VUnion<
    T[number],
    VLiteral<T[number]>[]
  >;
}

// ── Shared fields ─────────────────────────────────────────────────────────────

const location = v.optional(
  v.object({
    lat: v.number(),
    lng: v.number(),
    city: v.string(),
    zipCode: v.string(),
    country: v.string(),
    address: v.string(),
  }),
);

const woodType = literals(WOOD_TYPES);

const common = {
  name: v.string(),
  imageUrl: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
  damage: v.number(), // 1–5
  availableFrom: v.number(), // timestamp
  quantity: v.number(),
  location,
};

// ── Listing variants (all geometry in mm) ─────────────────────────────────────

export const bricksV = v.object({
  category: v.literal("constructionMaterials"),
  type: v.literal("bricks"),
  ...common,
  geometry: v.object({ width: v.number(), height: v.number(), length: v.number() }),
  usedOutside: v.boolean(),
  glazed: v.boolean(),
  colour: literals(BRICK_COLOURS),
});

export const woodV = v.object({
  category: v.literal("constructionMaterials"),
  type: v.literal("wood"),
  ...common,
  geometry: v.object({ width: v.number(), height: v.number(), length: v.number() }),
  use: v.object({ structural: v.boolean(), outsideUse: v.boolean() }),
  woodType,
});

export const windowV = v.object({
  category: v.literal("buildingMaterials"),
  type: v.literal("window"),
  ...common,
  geometry: v.object({ width: v.number(), frameThickness: v.number() }),
  woodType,
  windowType: literals(WINDOW_TYPES),
});

export const tileV = v.object({
  category: v.literal("buildingMaterials"),
  type: v.literal("tile"),
  ...common,
  geometry: v.object({ width: v.number(), length: v.number(), thickness: v.number() }),
  tileType: literals(TILE_TYPES),
  colour: literals(TILE_COLOURS),
});

export const doorV = v.object({
  category: v.literal("buildingMaterials"),
  type: v.literal("door"),
  ...common,
  geometry: v.object({ width: v.number(), height: v.number(), frameThickness: v.number() }),
  doorType: literals(DOOR_TYPES),
  material: literals(DOOR_MATERIALS),
  glazed: v.boolean(),
});

export const listingV = v.union(bricksV, woodV, windowV, tileV, doorV);
