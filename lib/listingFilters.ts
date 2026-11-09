import { ListingTypes } from './elements';
import { BRICK_COLOURS, TILE_COLOURS } from '@/convex/validators';

export type ListingType = (typeof ListingTypes)[number];
export type Direction = 'horizontal' | 'vertical';

// ── Colour ────────────────────────────────────────────────────────────────────

export const ALL_COLOURS = ['red', 'yellow', 'brown', 'blue', 'white', 'green'] as const;
export type Colour = (typeof ALL_COLOURS)[number];

export const COLOUR_OPTIONS: Record<ListingType, readonly Colour[]> = {
  bricks: BRICK_COLOURS,
  wood:   [],
  window: [],
  tile:   TILE_COLOURS,
  door:   [],
};

export const COLOUR_SWATCHES: Record<Colour, string> = {
  red:    '#c0392b',
  yellow: '#d4a017',
  brown:  '#7b4a1e',
  blue:   '#3b82f6',
  white:  '#f0ede8',
  green:  '#3a7d44',
};

export function computeColourOptions(active: Set<ListingType>): Colour[] {
  const types = active.size > 0 ? [...active] : (ListingTypes as readonly ListingType[]);
  const available = new Set<Colour>();
  for (const t of types) for (const c of COLOUR_OPTIONS[t]) available.add(c);
  return ALL_COLOURS.filter(c => available.has(c));
}

// ── Geometry ──────────────────────────────────────────────────────────────────

export const GEO: Record<ListingType, {
  width: [number, number];
  height?: [number, number];
  length?: [number, number];
}> = {
  bricks: { width: [30, 120],    height: [15, 250],    length: [120, 600]   },
  wood:   { width: [50, 5000],   height: [50, 5000],   length: [100, 5000]  },
  window: { width: [200, 2000]                                               },
  tile:   { width: [200, 2000],                         length: [50, 500]   },
  door:   { width: [600, 1200],  height: [1800, 2400]                       },
};

export type GeoUnion = {
  width:  [number, number];
  height: [number, number] | null;
  length: [number, number] | null;
};

export function computeGeoUnion(active: Set<ListingType>): GeoUnion {
  const types = active.size > 0 ? [...active] : (ListingTypes as readonly ListingType[]);

  let wLo = Infinity, wHi = -Infinity;
  let hLo = Infinity, hHi = -Infinity, hasH = false;
  let lLo = Infinity, lHi = -Infinity, hasL = false;

  for (const t of types) {
    const g = GEO[t];
    wLo = Math.min(wLo, g.width[0]); wHi = Math.max(wHi, g.width[1]);
    if (g.height) { hasH = true; hLo = Math.min(hLo, g.height[0]); hHi = Math.max(hHi, g.height[1]); }
    if (g.length) { hasL = true; lLo = Math.min(lLo, g.length[0]); lHi = Math.max(lHi, g.length[1]); }
  }

  return {
    width:  [wLo, wHi],
    height: hasH ? [hLo, hHi] : null,
    length: hasL ? [lLo, lHi] : null,
  };
}

// ── Area / direction (area-composer) ─────────────────────────────────────────

/**
 * Given a listing's geometry and a direction, return the 2D face dimensions
 * (u along x-axis, v along y-axis) in mm that would tile an area.
 * Returns null for types that cannot be meaningfully composed in the given direction.
 */
export function computeFace(
  geometry: Record<string, number>,
  type: ListingType
): { u: number; v: number; normal: [number, number, number] } | null {
  const { width, height, length, thickness } = geometry as {
    width: number;
    height?: number;
    length?: number;
    thickness?: number;
    frameThickness?: number;
  };

  if (type === 'bricks' || type === 'wood') {
    if (!height || !length) return null;
    return { u: length, v: width, normal: [0, 0, 1] };
  }

  if (type === 'tile') {
    if (!length) return null;
    return { u: length, v: width, normal: [0, 0, 1] };
  }

  // Window: no height stored — can't compose
  return null;
}

/**
 * Compute a rectangular grid layout that covers at least `targetArea_mm2`
 * using units with face dimensions u × v (mm).
 */
export function computeGrid(u: number, v: number, targetArea_mm2: number) {
  const unitsNeeded = Math.ceil(targetArea_mm2 / (u * v));
  const cols = Math.ceil(Math.sqrt((unitsNeeded * u) / v));
  const rows = Math.ceil(unitsNeeded / cols);
  return {
    columns: cols,
    rows,
    unitsInGrid: cols * rows,
    coveredArea_mm2: cols * rows * u * v
  };
}

// ── Rhino JSON export ─────────────────────────────────────────────────────────

export interface RhinoElement {
  listingId: string;
  name: string;
  type: string;
  colour?: string;
  unit: Record<string, number>;
  face: { u_mm: number; v_mm: number; area_mm2: number };
  grid: {
    origin: [number, number, number];
    uAxis: [number, number, number];
    vAxis: [number, number, number];
    normal: [number, number, number];
    columns: number;
    rows: number;
    uSpacing_mm: number;
    vSpacing_mm: number;
  };
  coverage: {
    unitsNeeded: number;
    unitsAvailable: number;
    isSufficient: boolean;
    coveredArea_m2: number;
  };
}

export interface RhinoCompositionJSON {
  schema: 'repurposed/area-composition/v1';
  timestamp: string;
  params: {
    targetArea_m2: number;
  };
  elements: RhinoElement[];
}

export function buildRhinoJSON(
  listings: Array<{
    _id: string;
    name: string;
    type: string;
    colour?: string;
    quantity: number;
    geometry: Record<string, number>;
  }>,
  targetArea_m2: number
): RhinoCompositionJSON {
  const targetArea_mm2 = targetArea_m2 * 1e6;

  const elements: RhinoElement[] = [];

  for (const listing of listings) {
    const face = computeFace(listing.geometry, listing.type as ListingType);
    if (!face) continue;

    const { u, v, normal } = face;
    const grid = computeGrid(u, v, targetArea_mm2);

    elements.push({
      listingId: listing._id,
      name: listing.name,
      type: listing.type,
      ...(listing.colour ? { colour: listing.colour } : {}),
      unit: listing.geometry,
      face: { u_mm: u, v_mm: v, area_mm2: u * v },
      grid: {
        origin: [0, 0, 0],
        uAxis: [1, 0, 0],
        vAxis: [0, 1, 0],
        normal,
        columns: grid.columns,
        rows: grid.rows,
        uSpacing_mm: u,
        vSpacing_mm: v
      },
      coverage: {
        unitsNeeded: grid.unitsInGrid,
        unitsAvailable: listing.quantity,
        isSufficient: listing.quantity >= grid.unitsInGrid,
        coveredArea_m2: grid.coveredArea_mm2 / 1e6
      }
    });
  }

  return {
    schema: 'repurposed/area-composition/v1',
    timestamp: new Date().toISOString(),
    params: { targetArea_m2 },
    elements
  };
}
