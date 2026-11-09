import { CardDetailLevel, ICardDisplayProps } from '@/lib/cardContent';
import { ListingTypes } from '@/lib/elements';
import {
  ALL_COLOURS, Colour, COLOUR_OPTIONS, COLOUR_SWATCHES,
  computeColourOptions, computeGeoUnion, GEO,
  type GeoUnion, type ListingType,
} from '@/lib/listingFilters';
import { useEffect, useMemo, useState } from 'react';
import { useRepurposedStore } from '@/lib/store';
import { ElementContentCard } from './ElementContentCard';
import { ElementMinimalCard } from './ElementMinimalCard';
import { useTranslation } from 'react-i18next';
import { TYPE_ICONS } from '@/lib/typeIcons';



// Local alias so the existing component code is unchanged
type Union = GeoUnion;
const computeUnion = computeGeoUnion;

// ── Dual-handle logarithmic range slider ──────────────────────────────────────

// Internal slider resolution — higher = smoother dragging at the extremes.
const LOG_STEPS = 1000;

/** Actual value → integer slider position [0, LOG_STEPS] */
function toLogPos(value: number, min: number, max: number): number {
  return Math.round((Math.log(value / min) / Math.log(max / min)) * LOG_STEPS);
}

/** Integer slider position [0, LOG_STEPS] → actual value (rounded to integer mm) */
function fromLogPos(pos: number, min: number, max: number): number {
  return Math.round(min * Math.pow(max / min, pos / LOG_STEPS));
}

const RangeSlider: React.FC<{
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}> = ({ label, min, max, value, onChange }) => {
  const [lo, hi] = value;
  const loPos = toLogPos(lo, min, max);
  const hiPos = toLogPos(hi, min, max);
  const loP = (loPos / LOG_STEPS) * 100;
  const hiP = (hiPos / LOG_STEPS) * 100;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium tabular-nums text-gray-700">
          {lo} – {hi} mm
        </span>
      </div>
      <div className="relative h-5 w-full select-none">
        {/* Background track */}
        <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-[3px] bg-gray-200" />
        {/* Active fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-gray-800"
          style={{ left: `${loP}%`, right: `${100 - hiP}%` }}
        />
        {/* Lo thumb (visual) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-800 pointer-events-none"
          style={{ left: `calc(${loP}% - 6px)` }}
        />
        {/* Hi thumb (visual) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-800 pointer-events-none"
          style={{ left: `calc(${hiP}% - 6px)` }}
        />
        {/* Lo input — pointer events disabled on track, enabled only on thumb */}
        <input
          type="range"
          min={0}
          max={LOG_STEPS}
          step={1}
          value={loPos}
          onChange={(e) => {
            const newLo = fromLogPos(Number(e.target.value), min, max);
            onChange([Math.min(newLo, hi - 1), hi]);
          }}
          className="absolute inset-0 w-full opacity-0 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: loPos >= hiPos ? 5 : 3 }}
        />
        {/* Hi input — same trick; higher z when thumbs overlap so hi stays draggable rightward */}
        <input
          type="range"
          min={0}
          max={LOG_STEPS}
          step={1}
          value={hiPos}
          onChange={(e) => {
            const newHi = fromLogPos(Number(e.target.value), min, max);
            onChange([lo, Math.max(newHi, lo + 1)]);
          }}
          className="absolute inset-0 w-full opacity-0 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: loPos >= hiPos ? 3 : 5 }}
        />
      </div>
    </div>
  );
};

// ── Geometry filter dropdown ──────────────────────────────────────────────────

const GeomFilterDropdown: React.FC<{
  union: Union;
  widthRange: [number, number];
  heightRange: [number, number];
  lengthRange: [number, number];
  onWidth: (v: [number, number]) => void;
  onHeight: (v: [number, number]) => void;
  onLength: (v: [number, number]) => void;
  onReset: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ union, widthRange, heightRange, lengthRange, onWidth, onHeight, onLength, onReset, open, setOpen }) => {
  const { t } = useTranslation('common');

  const isActive =
    widthRange[0] > union.width[0] ||
    widthRange[1] < union.width[1] ||
    (union.height && (heightRange[0] > union.height[0] || heightRange[1] < union.height[1])) ||
    (union.length && (lengthRange[0] > union.length[0] || lengthRange[1] < union.length[1]));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-2.5 py-1 text-sm border bg-white transition-colors ${
          isActive ? 'border-gray-800 text-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-500'
        }`}
      >
        <span>{t('dimensions')}</span>
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />}
        <span className="text-gray-400 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 shadow-lg z-50 p-4 flex flex-col gap-4 min-w-[240px]">
            <RangeSlider
              label={t('width')}
              min={union.width[0]}
              max={union.width[1]}
              value={widthRange}
              onChange={onWidth}
            />
            {union.height && (
              <RangeSlider
                label={t('height')}
                min={union.height[0]}
                max={union.height[1]}
                value={heightRange}
                onChange={onHeight}
              />
            )}
            {union.length && (
              <RangeSlider
                label={t('length')}
                min={union.length[0]}
                max={union.length[1]}
                value={lengthRange}
                onChange={onLength}
              />
            )}
            {isActive && (
              <>
                <div className="border-t border-gray-100" />
                <button
                  onClick={() => {
                    onReset();
                    setOpen(false);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-700 text-left transition-colors"
                >
                  {t('clear-filter')}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Detail level selector ─────────────────────────────────────────────────────

const DetailLevelSelector: React.FC<{
  detailLevel: (typeof CardDetailLevel)[number];
  setDetailLevel: (v: (typeof CardDetailLevel)[number]) => void;
}> = ({ detailLevel, setDetailLevel }) => {
  const { t } = useTranslation('common');

  return (
    <span className="flex flex-row gap-2 items-center">
      <label className="text-sm">{t('detail-level')}</label>:
      {CardDetailLevel.map((dL) => (
        <div key={dL} className="flex flex-row gap-1.5 items-center">
          <input
            id={`dl-${dL}`}
            onChange={() => setDetailLevel(detailLevel === 'content' ? 'minimal' : 'content')}
            checked={detailLevel === dL}
            type="radio"
            value={dL}
          />
          <label htmlFor={`dl-${dL}`} className="text-sm cursor-pointer">
            {t(dL)}
          </label>
        </div>
      ))}
    </span>
  );
};

// ── Type multi-select ─────────────────────────────────────────────────────────

const TypeMultiSelect: React.FC<{
  activeTypes: Set<ListingType>;
  onToggle: (type: ListingType) => void;
  onClear: () => void;
}> = ({ activeTypes, onToggle, onClear }) => {
  const { t: te } = useTranslation('element-type');
  const { t: tc } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const label = activeTypes.size === 0 ? tc('all-types') : [...activeTypes].map((type) => te(type)).join(', ');

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1 text-sm border border-gray-300 bg-white hover:border-gray-500 transition-colors"
      >
        <span className="max-w-[160px] truncate text-left text-gray-700">{label}</span>
        <span className="text-gray-400 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-50 min-w-[160px]">
            {ListingTypes.map((type) => {
              const checked = activeTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => onToggle(type)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}
                  >
                    {checked && <span className="text-white text-[10px] leading-none">✓</span>}
                  </span>
                  <img src={TYPE_ICONS[type]} className="w-4 h-4 opacity-60" alt="" />
                  <span>{te(type)}</span>
                </button>
              );
            })}
            {activeTypes.size > 0 && (
              <>
                <div className="border-t border-gray-100 mx-3 my-1" />
                <button
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 text-left transition-colors"
                >
                  {tc('clear-filter')}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Colour multi-select ───────────────────────────────────────────────────────

const ColourMultiSelect: React.FC<{
  availableColours: Colour[];
  activeColours: Set<Colour>;
  onToggle: (colour: Colour) => void;
  onClear: () => void;
}> = ({ availableColours, activeColours, onToggle, onClear }) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  if (availableColours.length === 0) return null;

  const isActive = activeColours.size > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-2.5 py-1 text-sm border bg-white transition-colors ${
          isActive ? 'border-gray-800 text-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-500'
        }`}
      >
        {isActive ? (
          <span className="flex items-center gap-1">
            {[...activeColours].slice(0, 5).map((c) => (
              <span
                key={c}
                className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                style={{ backgroundColor: COLOUR_SWATCHES[c] }}
              />
            ))}
            {activeColours.size > 5 && <span className="text-xs text-gray-500">+{activeColours.size - 5}</span>}
          </span>
        ) : (
          <span>{t('all-colours')}</span>
        )}
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />}
        <span className="text-gray-400 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-50 min-w-[160px]">
            {availableColours.map((colour) => {
              const checked = activeColours.has(colour);
              return (
                <button
                  key={colour}
                  onClick={() => onToggle(colour)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}
                  >
                    {checked && <span className="text-white text-[10px] leading-none">✓</span>}
                  </span>
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: COLOUR_SWATCHES[colour] }}
                  />
                  <span>{t(`colour-${colour}`)}</span>
                </button>
              );
            })}
            {isActive && (
              <>
                <div className="border-t border-gray-100 mx-3 my-1" />
                <button
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 text-left transition-colors"
                >
                  {t('clear-filter')}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Card renderer ─────────────────────────────────────────────────────────────

export const CardRenderer: React.FC<ICardDisplayProps> = ({ detailLevel, elements, className }) => {
  const { t: tc } = useTranslation('common');
  const [localDetailLevel, setLocalDetailLevel] = useState<(typeof CardDetailLevel)[number]>(detailLevel ?? 'minimal');

  // Type filter
  const [activeTypes, setActiveTypes] = useState<Set<ListingType>>(new Set());
  const toggleType = (type: ListingType) =>
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  const clearTypes = () => setActiveTypes(new Set());

  // Colour filter
  const [activeColours, setActiveColours] = useState<Set<Colour>>(new Set());
  const toggleColour = (c: Colour) =>
    setActiveColours((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  const clearColours = () => setActiveColours(new Set());

  // Reset colour selection when type filter changes (available colours may shrink)
  useEffect(() => {
    setActiveColours(new Set());
  }, [activeTypes]);

  const availableColours = computeColourOptions(activeTypes);

  // Geometry bounds derived from ACTUAL element data so listings outside the
  // hardcoded GEO constants are never silently filtered out.
  const geomUnion = useMemo((): GeoUnion => {
    const relevant = activeTypes.size > 0
      ? elements.filter(e => activeTypes.has(e.type as ListingType))
      : elements;
    if (relevant.length === 0) return computeUnion(activeTypes);

    let wLo = Infinity, wHi = -Infinity;
    let hLo = Infinity, hHi = -Infinity, hasH = false;
    let lLo = Infinity, lHi = -Infinity, hasL = false;

    for (const e of relevant) {
      const g = e.geometry as Record<string, number>;
      wLo = Math.min(wLo, g.width); wHi = Math.max(wHi, g.width);
      if ('height' in g) { hasH = true; hLo = Math.min(hLo, g.height); hHi = Math.max(hHi, g.height); }
      if ('length' in g) { hasL = true; lLo = Math.min(lLo, g.length); lHi = Math.max(lHi, g.length); }
    }

    return {
      width:  [wLo, wHi],
      height: hasH ? [hLo, hHi] : null,
      length: hasL ? [lLo, lHi] : null,
    };
  }, [elements, activeTypes]);

  const [widthRange, setWidthRange]   = useState<[number, number]>(geomUnion.width);
  const [heightRange, setHeightRange] = useState<[number, number]>(geomUnion.height ?? [0, 0]);
  const [lengthRange, setLengthRange] = useState<[number, number]>(geomUnion.length ?? [0, 0]);

  // Reset slider ranges to the actual data bounds whenever the type filter changes.
  useEffect(() => {
    setWidthRange(geomUnion.width);
    if (geomUnion.height) setHeightRange(geomUnion.height);
    if (geomUnion.length) setLengthRange(geomUnion.length);
  // geomUnion already depends on activeTypes; we intentionally don't re-run when
  // only new elements arrive (would reset user-chosen ranges mid-session).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTypes]);

  const [geomOpen, setGeomOpen] = useState(false);

  const resetGeom = () => {
    setWidthRange(geomUnion.width);
    if (geomUnion.height) setHeightRange(geomUnion.height);
    if (geomUnion.length) setLengthRange(geomUnion.length);
  };

  const isGeomActive =
    widthRange[0] > geomUnion.width[0] ||
    widthRange[1] < geomUnion.width[1] ||
    !!(geomUnion.height && (heightRange[0] > geomUnion.height[0] || heightRange[1] < geomUnion.height[1])) ||
    !!(geomUnion.length && (lengthRange[0] > geomUnion.length[0] || lengthRange[1] < geomUnion.length[1]));

  const isAnyFilterActive = activeTypes.size > 0 || isGeomActive || activeColours.size > 0;

  const clearAllFilters = () => {
    // geomUnion with empty activeTypes = bounds across ALL elements
    setActiveTypes(new Set());
    // Ranges will be reset by the useEffect above; also set immediately so
    // the filter clears on the same render cycle.
    setWidthRange(geomUnion.width);
    if (geomUnion.height) setHeightRange(geomUnion.height);
    if (geomUnion.length) setLengthRange(geomUnion.length);
    setActiveColours(new Set());
    setGeomOpen(false);
  };

  // Apply filters
  const filteredElements = elements.filter((listing) => {
    // Type filter
    if (activeTypes.size > 0 && !activeTypes.has(listing.type as ListingType)) return false;

    // Geometry filter — listings without a dimension automatically pass that dimension
    const g = listing.geometry as Record<string, number>;
    if (g.width < widthRange[0] || g.width > widthRange[1]) return false;
    if ('height' in g && (g.height < heightRange[0] || g.height > heightRange[1])) return false;
    if ('length' in g && (g.length < lengthRange[0] || g.length > lengthRange[1])) return false;

    // Colour filter — listings without a colour field automatically pass
    if (activeColours.size > 0 && 'colour' in listing) {
      if (!activeColours.has((listing as { colour: Colour }).colour)) return false;
    }

    return true;
  });

  // ── Map-marker focus ─────────────────────────────────────────────────────────
  const focusedListingId    = useRepurposedStore((s) => s.focusedListingId);
  const setFocusedListingId = useRepurposedStore((s) => s.setFocusedListingId);

  useEffect(() => {
    if (!focusedListingId) return;
    const node = document.querySelector(`[data-listing-id="${focusedListingId}"]`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setFocusedListingId(null), 2500);
    return () => clearTimeout(t);
  }, [focusedListingId, setFocusedListingId]);

  return (
    <div className={`${className} overlfow-y-none grid grid-rows-[auto_1fr] w-full`}>
      <div className="w-full bg-background z-1 pt-1">
        <div className="card-grid-padding flex flex-row items-center justify-between gap-4 flex-wrap pb-1">
          <DetailLevelSelector detailLevel={localDetailLevel} setDetailLevel={setLocalDetailLevel} />
          <div className="flex items-center gap-2">
            {isAnyFilterActive ? (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1 text-sm text-gray-400 hover:text-gray-800 border border-transparent hover:border-gray-300 transition-colors"
              >
                {tc('clear-all-filters')}
              </button>
            ) : undefined}

            <TypeMultiSelect activeTypes={activeTypes} onToggle={toggleType} onClear={clearTypes} />
            <GeomFilterDropdown
              union={geomUnion}
              widthRange={widthRange}
              heightRange={heightRange}
              lengthRange={lengthRange}
              onWidth={setWidthRange}
              onHeight={setHeightRange}
              onLength={setLengthRange}
              onReset={resetGeom}
              open={geomOpen}
              setOpen={setGeomOpen}
            />
            <ColourMultiSelect
              availableColours={availableColours}
              activeColours={activeColours}
              onToggle={toggleColour}
              onClear={clearColours}
            />
          </div>
        </div>
        <div className="h-0">
          <div className="h-5 w-full bg-linear-to-b from-background to-transparent" />
        </div>
      </div>

      <div className="w-full overflow-y-auto">
        <div className="h-5" />
        <div className="w-full">
          <div className={`element-card-grid card-grid-padding ${localDetailLevel}`}>
            {filteredElements.map((element) =>
              localDetailLevel === 'minimal' ? (
                <ElementMinimalCard
                  key={element._id}
                  element={element}
                  highlighted={focusedListingId === element._id}
                />
              ) : (
                <ElementContentCard
                  key={element._id}
                  element={element}
                  highlighted={focusedListingId === element._id}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};;;
