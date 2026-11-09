import { Navigation } from '@/components/Navigation';
import { SVGIcon } from '@/components/SVGIcon';
import { ListingTypes, type ListingData } from '@/lib/elements';
import {
  ALL_COLOURS, Colour,
  computeColourOptions, computeGeoUnion,
  type ListingType, type Direction,
  computeFace, computeGrid, buildRhinoJSON,
} from '@/lib/listingFilters';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { useState } from 'react';
import { TYPE_ICONS } from '@/lib/typeIcons';
import { ColourMultiSelect, GeomFilterDropdown, TypeMultiSelect } from '@/components/filters/ListingFilters';

import home from '/assets/icons/home.svg';
import listIcon from '/assets/icons/customize.svg';

// ── Coverage card ─────────────────────────────────────────────────────────────

const CoverageCard: React.FC<{
  listing: ListingData;
  area: number;
  selected: boolean;
  onToggle: () => void;
  t: (k: string) => string;
}> = ({ listing, area, selected, onToggle, t }) => {
  const g = listing.geometry as Record<string, number>;
  const face = computeFace(g, listing.type as ListingType);
  const grid = face && area > 0 ? computeGrid(face.u, face.v, area * 1e6) : null;
  const isSufficient = grid ? listing.quantity >= grid.unitsInGrid : null;

  return (
    <button
      onClick={onToggle}
      className={`flex flex-col text-left w-full overflow-hidden transition-all ${
        selected ? 'border-2 border-gray-900 shadow-md' : 'border border-gray-200 hover:border-gray-400'
      } bg-white`}
    >
      {/* Image / icon */}
      <div className="relative h-32 w-full bg-gray-100 flex items-center justify-center">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover" />
        ) : (
          <img src={TYPE_ICONS[listing.type as ListingType]} className="w-10 h-10 opacity-30" alt="" />
        )}
        {/* Selection checkmark */}
        {selected && (
          <span className="absolute top-2 left-2 w-5 h-5 bg-gray-900 flex items-center justify-center">
            <span className="text-white text-[10px] leading-none">✓</span>
          </span>
        )}
        {/* Status badge */}
        {grid && (
          <span
            className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 ${isSufficient ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
          >
            {isSufficient ? t('sufficient') : t('insufficient')}
          </span>
        )}
        {!face && area > 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500">
            {t('not-composable')}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 leading-tight">{listing.name}</span>
          <img
            src={TYPE_ICONS[listing.type as ListingType]}
            className="w-4 h-4 opacity-50 flex-shrink-0 mt-0.5"
            alt=""
          />
        </div>

        {face ? (
          <div className="text-xs text-gray-500 tabular-nums">
            {face.u} × {face.v} mm&nbsp; ({t('unit-face')})
          </div>
        ) : (
          <div className="text-xs text-gray-400">{t('no-face-for-direction')}</div>
        )}

        {grid && (
          <>
            <div className="text-xs text-gray-700 tabular-nums">
              {grid.unitsInGrid.toLocaleString()} {t('units-needed')}
              &nbsp;/&nbsp;
              {listing.quantity.toLocaleString()} {t('units-available')}
            </div>
            <div className="h-1.5 bg-gray-100 w-full overflow-hidden">
              <div
                className={`h-full transition-all ${isSufficient ? 'bg-green-500' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(100, (listing.quantity / grid.unitsInGrid) * 100).toFixed(1)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {((listing.quantity / grid.unitsInGrid) * 100).toFixed(0)}% {t('coverage')}
            </div>
          </>
        )}
      </div>
    </button>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const AreaComposer = () => {
  const { t } = useTranslation('area-composer');
  const { t: tc } = useTranslation('common');
  const [searchParams, setSearchParams] = useSearchParams();
  const listings = useQuery(api.listings.list) ?? [];

  // ── URL is the single source of truth for all filter state ────────────────
  //
  // Params:  area, direction, types, colours, wMin, wMax, hMin, hMax, lMin, lMax
  //
  // updateQuery merges a patch into the current query, removing undefined keys,
  // and replaces the URL shallowly (no full re-render / no history entry).

  const q: Record<string, string | undefined> = Object.fromEntries(searchParams);

  const updateQuery = (patch: Record<string, string | undefined>) => {
    const next: Record<string, string> = {};
    // Carry over existing params, then apply patch
    for (const [k, v] of Object.entries({ ...q, ...patch })) {
      if (v !== undefined) next[k] = v;
    }
    setSearchParams(next, { replace: true });
  };

  // ── Derive state from URL ─────────────────────────────────────────────────

  const area = q.area ? Math.max(0, Number(q.area)) : 0;

  const activeTypes: Set<ListingType> = new Set(
    q.types
      ? (String(q.types)
          .split(',')
          .filter((t) => (ListingTypes as readonly string[]).includes(t)) as ListingType[])
      : []
  );

  const activeColours: Set<Colour> = new Set(
    q.colours
      ? (String(q.colours)
          .split(',')
          .filter((c) => (ALL_COLOURS as readonly string[]).includes(c)) as Colour[])
      : []
  );

  const geomUnion = computeGeoUnion(activeTypes);

  const widthRange: [number, number] = [
    q.wMin ? Math.max(geomUnion.width[0], Number(q.wMin)) : geomUnion.width[0],
    q.wMax ? Math.min(geomUnion.width[1], Number(q.wMax)) : geomUnion.width[1]
  ];
  const heightRange: [number, number] = geomUnion.height
    ? [
        q.hMin ? Math.max(geomUnion.height[0], Number(q.hMin)) : geomUnion.height[0],
        q.hMax ? Math.min(geomUnion.height[1], Number(q.hMax)) : geomUnion.height[1]
      ]
    : [0, 0];
  const lengthRange: [number, number] = geomUnion.length
    ? [
        q.lMin ? Math.max(geomUnion.length[0], Number(q.lMin)) : geomUnion.length[0],
        q.lMax ? Math.min(geomUnion.length[1], Number(q.lMax)) : geomUnion.length[1]
      ]
    : [0, 0];

  // ── Area input: local string so decimal points survive mid-type ───────────
  const [areaStr, setAreaStr] = useState(q.area ?? '');

  const handleAreaChange = (raw: string) => {
    setAreaStr(raw);
    const num = parseFloat(raw);
    updateQuery({ area: !isNaN(num) && num > 0 ? String(num) : undefined });
  };

  // When types change, reset colours and geometry (remove those params from URL)
  const toggleType = (type: ListingType) => {
    const next = new Set(activeTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    updateQuery({
      types: next.size > 0 ? [...next].join(',') : undefined,
      colours: undefined,
      wMin: undefined,
      wMax: undefined,
      hMin: undefined,
      hMax: undefined,
      lMin: undefined,
      lMax: undefined
    });
  };
  const clearTypes = () =>
    updateQuery({
      types: undefined,
      colours: undefined,
      wMin: undefined,
      wMax: undefined,
      hMin: undefined,
      hMax: undefined,
      lMin: undefined,
      lMax: undefined
    });

  const toggleColour = (c: Colour) => {
    const next = new Set(activeColours);
    next.has(c) ? next.delete(c) : next.add(c);
    updateQuery({ colours: next.size > 0 ? [...next].join(',') : undefined });
  };
  const clearColours = () => updateQuery({ colours: undefined });

  const setWidthRange = (v: [number, number]) =>
    updateQuery({
      wMin: v[0] > geomUnion.width[0] ? String(v[0]) : undefined,
      wMax: v[1] < geomUnion.width[1] ? String(v[1]) : undefined
    });
  const setHeightRange = (v: [number, number]) => {
    if (!geomUnion.height) return;
    updateQuery({
      hMin: v[0] > geomUnion.height[0] ? String(v[0]) : undefined,
      hMax: v[1] < geomUnion.height[1] ? String(v[1]) : undefined
    });
  };
  const setLengthRange = (v: [number, number]) => {
    if (!geomUnion.length) return;
    updateQuery({
      lMin: v[0] > geomUnion.length[0] ? String(v[0]) : undefined,
      lMax: v[1] < geomUnion.length[1] ? String(v[1]) : undefined
    });
  };
  const resetGeom = () =>
    updateQuery({
      wMin: undefined,
      wMax: undefined,
      hMin: undefined,
      hMax: undefined,
      lMin: undefined,
      lMax: undefined
    });

  const availableColours = computeColourOptions(activeTypes);

  const isGeomActive =
    widthRange[0] > geomUnion.width[0] ||
    widthRange[1] < geomUnion.width[1] ||
    !!(geomUnion.height && (heightRange[0] > geomUnion.height[0] || heightRange[1] < geomUnion.height[1])) ||
    !!(geomUnion.length && (lengthRange[0] > geomUnion.length[0] || lengthRange[1] < geomUnion.length[1]));

  const isAnyFilterActive = activeTypes.size > 0 || isGeomActive || activeColours.size > 0;

  const clearAllFilters = () =>
    updateQuery({
      types: undefined,
      colours: undefined,
      wMin: undefined,
      wMax: undefined,
      hMin: undefined,
      hMax: undefined,
      lMin: undefined,
      lMax: undefined
    });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectAll = (ids: string[]) => setSelectedIds(new Set(ids));
  const deselectAll = () => setSelectedIds(new Set());

  const filtered = listings.filter((listing) => {
    if (activeTypes.size > 0 && !activeTypes.has(listing.type as ListingType)) return false;
    const g = listing.geometry as Record<string, number>;
    if (g.width < widthRange[0] || g.width > widthRange[1]) return false;
    if ('height' in g && (g.height < heightRange[0] || g.height > heightRange[1])) return false;
    if ('length' in g && (g.length < lengthRange[0] || g.length > lengthRange[1])) return false;
    if (activeColours.size > 0 && 'colour' in listing) {
      if (!activeColours.has((listing as { colour: Colour }).colour)) return false;
    }
    return true;
  });

  // Total area that selected listings can cover, using all their available units.
  // Each listing contributes: quantity × face.u × face.v  (mm²), converted to m².
  const selectedListings = filtered.filter((l) => selectedIds.has(l._id));
  const totalCoveredArea = selectedListings.reduce((sum, l) => {
    const face = computeFace(l.geometry as Record<string, number>, l.type as ListingType);
    if (!face) return sum;
    return sum + (l.quantity * face.u * face.v) / 1e6;
  }, 0);
  const coveragePct = area > 0 ? Math.min(100, (totalCoveredArea / area) * 100) : 0;
  const allSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l._id));

  // ── Rhino JSON — copy to clipboard + open Rhino ───────────────────────────

  const [rhinoCopied, setRhinoCopied] = useState(false);

  const sendToRhino = async () => {
    const json = buildRhinoJSON(
      selectedListings.map((l) => ({
        _id: l._id,
        name: l.name,
        type: l.type,
        colour: (l as { colour?: string }).colour,
        quantity: l.quantity,
        geometry: l.geometry as Record<string, number>
      })),
      area
    );
    const text = JSON.stringify(json, null, 2);

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers that block clipboard without user gesture context
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    // Attempt to bring Rhino to the foreground via its registered URL scheme.
    window.location.href = 'rhinoceros://';

    setRhinoCopied(true);
    setTimeout(() => setRhinoCopied(false), 3000);
  };

  return (
    <>
      <Navigation
        links={[
          { href: 'all-elements', text: 'to-all-elements', icon: <SVGIcon src={listIcon} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home} /> }
        ]}
      />

      <div className="w-full h-[calc(100svh-4.5rem)] grid grid-rows-[auto_auto_1fr] overflow-hidden max-w-standard-div">
        {/* ── Filter bar ── */}
        <div className="w-full bg-background z-10 pt-2 pb-1 card-grid-padding border-b border-gray-100">
          <div className="flex flex-row flex-wrap items-center gap-3">
            {/* Area input */}
            <div className="flex items-center gap-1.5">
              <label className="text-sm text-gray-500 whitespace-nowrap">{t('area')}</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={areaStr}
                placeholder="0"
                onChange={(e) => handleAreaChange(e.target.value)}
                className="w-20 text-sm border border-gray-300 px-2 py-1 bg-white focus:outline-none focus:border-gray-600 tabular-nums"
              />
              <span className="text-sm text-gray-500">m²</span>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-gray-200" />

            {/* Standard listing filters */}
            <TypeMultiSelect activeTypes={activeTypes} onToggle={toggleType} onClear={clearTypes} />
            <ColourMultiSelect
              availableColours={availableColours}
              activeColours={activeColours}
              onToggle={toggleColour}
              onClear={clearColours}
            />
            <GeomFilterDropdown
              union={geomUnion}
              widthRange={widthRange}
              heightRange={heightRange}
              lengthRange={lengthRange}
              onWidth={setWidthRange}
              onHeight={setHeightRange}
              onLength={setLengthRange}
              onReset={resetGeom}
            />

            {isAnyFilterActive && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1 text-sm text-gray-400 hover:text-gray-800 border border-transparent hover:border-gray-300 transition-colors"
              >
                {tc('clear-all-filters')}
              </button>
            )}
          </div>
        </div>

        {/* ── Coverage summary bar ── */}
        <div className="w-full bg-white border-b border-gray-100 card-grid-padding py-2">
          <div className="flex items-center gap-3">
            {/* Select-all toggle */}
            {filtered.length > 0 && (
              <button
                onClick={() => (allSelected ? deselectAll() : selectAll(filtered.map((l) => l._id)))}
                className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap transition-colors"
              >
                {allSelected ? t('deselect-all') : t('select-all')}
              </button>
            )}

            {selectedIds.size > 0 && area > 0 ? (
              <>
                <div className="flex-1 h-2 bg-gray-100 overflow-hidden min-w-[80px]">
                  <div
                    className={`h-full transition-all ${coveragePct >= 100 ? 'bg-green-500' : 'bg-gray-800'}`}
                    style={{ width: `${coveragePct.toFixed(1)}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums text-gray-700 whitespace-nowrap">
                  <span className="font-medium">{totalCoveredArea.toFixed(2)}</span>
                  {' / '}
                  {area} m²{' '}
                  <span className={`text-xs ${coveragePct >= 100 ? 'text-green-600' : 'text-gray-500'}`}>
                    ({Math.round(coveragePct)}%)
                  </span>
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">
                {selectedIds.size === 0 ? t('select-to-see-coverage') : t('set-area-to-see-coverage')}
              </span>
            )}
          </div>
        </div>

        {/* ── Results grid ── */}
        <div className="w-full overflow-y-auto">
          <div className="h-4" />
          {filtered.length === 0 ? (
            <div className="card-grid-padding text-sm text-gray-400">{t('no-results')}</div>
          ) : (
            <div className="element-card-grid card-grid-padding minimal">
              {filtered.map((listing) => (
                <CoverageCard
                  key={listing._id}
                  listing={listing}
                  area={area}
                  selected={selectedIds.has(listing._id)}
                  onToggle={() => toggleSelected(listing._id)}
                  t={t}
                />
              ))}
            </div>
          )}
          <div className="h-20" />
        </div>
      </div>

      {/* ── Send to Rhino button ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 right-6 z-20">
          <button
            onClick={sendToRhino}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors shadow-lg ${
              rhinoCopied ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
          >
            <span>{rhinoCopied ? '✓' : '⬆'}</span>
            <span>{rhinoCopied ? 'Copied — opening Rhino…' : `${t('export-rhino-json')} (${selectedIds.size})`}</span>
          </button>
        </div>
      )}
    </>
  );
};;

export default AreaComposer;
