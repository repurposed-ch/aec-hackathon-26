import { CardDetailLevel, ICardDisplayProps } from '@/lib/cardContent';
import {
  Colour, computeColourOptions, computeGeoUnion,
  type GeoUnion, type ListingType,
} from '@/lib/listingFilters';
import { useEffect, useMemo, useState } from 'react';
import { useRepurposedStore } from '@/lib/store';
import { ElementContentCard } from './ElementContentCard';
import { ElementMinimalCard } from './ElementMinimalCard';
import { useTranslation } from 'react-i18next';
import { ColourMultiSelect, GeomFilterDropdown, TypeMultiSelect } from '@/components/filters/ListingFilters';


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
    if (relevant.length === 0) return computeGeoUnion(activeTypes);

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
