import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useTranslation } from 'react-i18next';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import type { ListingData } from '@/lib/elements';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/Button';
import { SVGIcon } from '@/components/SVGIcon';
import {
  type ListingType,
  type FormData,
  defaultForm,
  CommonFields,
  buildListingPayload,
  listingToForm,
} from '@/components/listing-form/Shared';
import { TYPE_ICONS } from '@/lib/typeIcons';

import home from '/assets/icons/home.svg';
import cart from '/assets/icons/shopping_cart.svg';

// ── Helpers ───────────────────────────────────────────────────────────────────

function geomVal(listing: ListingData, key: string): number | null {
  return key in listing.geometry ? (listing.geometry as Record<string, number>)[key] ?? null : null;
}

// ── Edit panel ────────────────────────────────────────────────────────────────

interface EditPanelProps {
  listing: ListingData;
  onClose: () => void;
  onSaved: () => void;
}

const EditPanel: React.FC<EditPanelProps> = ({ listing, onClose, onSaved }) => {
  const { t } = useTranslation('listing-form');
  const updateListing = useMutation(api.listings.update);
  const removeListing = useMutation(api.listings.remove);

  const [form, setFormRaw] = useState<FormData>(() => listingToForm(listing));
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Re-initialise when the selected listing changes.
  useEffect(() => {
    setFormRaw(listingToForm(listing));
    setSaved(false);
    setConfirmDelete(false);
  }, [listing._id]);

  const set = useCallback((patch: Partial<FormData>) => setFormRaw((prev) => ({ ...prev, ...patch })), []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await updateListing({
        id: listing._id as Id<'listings'>,
        data: buildListingPayload(form, listing.type as ListingType),
      });
      setSaved(true);
      setTimeout(onSaved, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await removeListing({ id: listing._id as Id<'listings'> });
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const selectedType = listing.type as ListingType;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <SVGIcon src={TYPE_ICONS[selectedType]} className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-800 capitalize">{selectedType}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-600 text-sm truncate max-w-[200px]">{listing.name}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-xl leading-none transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <div className="overflow-y-auto flex-1 pb-4">
        <CommonFields form={form} set={set} t={t} selectedType={selectedType} />
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-200 bg-white flex flex-col gap-2">
        {saved ? (
          <div className="text-center text-sm font-medium text-green-600">✓ {t('save-changes')} saved</div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.name}
            className="w-full py-2 text-sm font-semibold"
          >
            {submitting ? t('saving') : t('save-changes')}
          </Button>
        )}

        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting…' : 'Confirm delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="w-full py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            Remove listing
          </button>
        )}
      </div>
    </div>
  );
};

// ── Columns ───────────────────────────────────────────────────────────────────

type Column = {
  header: string;
  value: (l: ListingData) => string | number | null;
  numeric?: boolean;
};

const columns: Column[] = [
  { header: 'Name', value: (l) => l.name },
  { header: 'Type', value: (l) => l.type },
  { header: 'Colour', value: (l) => ('colour' in l ? l.colour : null) },
  { header: 'Qty', value: (l) => l.quantity, numeric: true },
  { header: 'W (mm)', value: (l) => geomVal(l, 'width'), numeric: true },
  { header: 'H (mm)', value: (l) => geomVal(l, 'height'), numeric: true },
  { header: 'L (mm)', value: (l) => geomVal(l, 'length'), numeric: true },
  { header: 'Damage', value: (l) => l.damage, numeric: true },
  { header: 'Available', value: (l) => l.availableFrom, numeric: true },
  { header: 'City', value: (l) => l.location?.city ?? null },
];

const formatCell = (col: Column, l: ListingData) => {
  const v = col.value(l);
  if (v === null) return '—';
  return col.header === 'Available' ? new Date(v).toLocaleDateString() : v;
};

const compare = (a: string | number | null, b: string | number | null) => {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));
};

// ── Main page ─────────────────────────────────────────────────────────────────

const ListingsTable: React.FC = () => {
  const allListings = useQuery(api.listings.list);
  const listings: ListingData[] = (allListings as ListingData[] | undefined) ?? [];

  const [selectedListing, setSelectedListing] = useState<ListingData | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? listings.filter((l) => columns.some((c) => String(formatCell(c, l)).toLowerCase().includes(q)))
      : listings;
    if (!sort) return filtered;
    const col = columns[sort.col];
    return [...filtered].sort((a, b) => compare(col.value(a), col.value(b)) * sort.dir);
  }, [listings, search, sort]);

  const toggleSort = (col: number) =>
    setSort((prev) => (prev?.col !== col ? { col, dir: 1 } : prev.dir === 1 ? { col, dir: -1 } : null));

  const panelOpen = selectedListing !== null;
  const handleClose = useCallback(() => setSelectedListing(null), []);
  const handleSaved = useCallback(() => {
    // Keep the panel open so the user can see the success state.
  }, []);

  return (
    <>
      <Navigation
        links={[
          { href: 'all-elements', text: 'to-all-elements', icon: <SVGIcon src={cart} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home} /> },
        ]}
        withoutTopMargin
      />

      <div className="w-full flex flex-row h-[calc(100svh-4.5rem)] mt-[4.5rem] overflow-hidden">
        {/* Table */}
        <div className={`flex flex-col transition-all duration-200 ${panelOpen ? 'w-[58%]' : 'w-full'}`}>
          <div className="shrink-0 p-2 border-b border-gray-200 text-left">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full max-w-xs border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-gray-600">
                <tr>
                  {columns.map((c, i) => (
                    <th
                      key={c.header}
                      onClick={() => toggleSort(i)}
                      className={`px-3 py-2 font-semibold whitespace-nowrap cursor-pointer select-none border-b border-gray-200 ${c.numeric ? 'text-right' : 'text-left'}`}
                    >
                      {c.header}
                      {sort?.col === i ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr
                    key={l._id}
                    onClick={() => setSelectedListing((prev) => (prev?._id === l._id ? null : l))}
                    className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${selectedListing?._id === l._id ? 'bg-yellow-50' : ''}`}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.header}
                        className={`px-3 py-2 whitespace-nowrap ${c.numeric ? 'text-right tabular-nums' : 'text-left'}`}
                      >
                        {formatCell(c, l)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit panel */}
        {panelOpen && selectedListing && (
          <div className="w-[42%] border-l border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
            <EditPanel listing={selectedListing} onClose={handleClose} onSaved={handleSaved} />
          </div>
        )}
      </div>
    </>
  );
};

export default ListingsTable;
