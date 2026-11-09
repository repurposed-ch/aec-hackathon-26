import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from 'convex/react';
import { useTranslation } from 'next-i18next';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/Button';
import { SVGIcon } from '@/components/SVGIcon';
import { ThreeViewerContainer } from '@/components/viewers/ThreeViewerContainer';
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic';
import { TYPE_ICONS } from '@/lib/typeIcons';
import { buildListingPreviewSpecFromForm } from '@/lib/openplans/listingPreview';
import {
  type ListingType,
  type FormData,
  defaultForm,
  CommonFields,
  buildListingPayload,
  listingToForm,
} from '@/components/listing-form/Shared';

import home from '/assets/icons/home.svg';
import cart from '/assets/icons/shopping_cart.svg';

// ── Success screen ────────────────────────────────────────────────────────────

const SuccessScreen: React.FC<{ listingId: string; t: (k: string) => string }> = ({ listingId, t }) => (
  <div className="flex flex-col items-center gap-6 py-16">
    <div className="text-5xl">✓</div>
    <h2 className="text-2xl font-bold">{t('edit-success-title')}</h2>
    <p className="text-gray-600">{t('edit-success-message')}</p>
    <div className="flex flex-row gap-4">
      <Button href={`/elements?id=${listingId}`}>{t('back-to-listing')}</Button>
      <Button href="/all-elements">{t('view-all')}</Button>
    </div>
  </div>
);

// ── Main page ────────────────────────────────────────────────────────────────

const EditListing: React.FC = () => {
  const { t } = useTranslation('listing-form');
  const router = useRouter();
  const updateListing = useMutation(api.listings.update);

  const rawId = router.isReady ? router.query.id : undefined;
  const listingId = typeof rawId === 'string' ? (rawId as Id<'listings'>) : undefined;

  const listing = useQuery(api.listings.getById, listingId ? { id: listingId } : 'skip');

  const [form, setFormRaw] = useState<FormData>(defaultForm);
  const [initialised, setInitialised] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Pre-populate form once the listing loads (only once).
  useEffect(() => {
    if (listing && !initialised) {
      setFormRaw(listingToForm(listing));
      setInitialised(true);
    }
  }, [listing, initialised]);

  const set = (patch: Partial<FormData>) => setFormRaw((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!listingId || !listing) return;
    setSubmitting(true);
    try {
      await updateListing({
        id: listingId,
        data: buildListingPayload(form, listing.type as ListingType),
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = !router.isReady || (listingId !== undefined && listing === undefined);
  const selectedType = listing?.type as ListingType | undefined;
  const previewSpec = useMemo(
    () => (selectedType && initialised ? buildListingPreviewSpecFromForm(form, selectedType) : null),
    [form, initialised, selectedType],
  );

  return (
    <>
      <Navigation
        links={[
          { href: 'all-elements', text: 'to-all-elements', icon: <SVGIcon src={cart.src} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home.src} /> },
        ]}
        withoutTopMargin
      />

      {isLoading && (
        <main className="w-full max-w-standard-div mx-auto px-4 pb-16 pt-20">
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
        </main>
      )}

      {!isLoading && !listing && listingId && (
        <main className="w-full max-w-standard-div mx-auto px-4 pb-16 pt-20">
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Listing not found.</div>
        </main>
      )}

      {!isLoading && listing && !done && selectedType && initialised && (
        <main className="configurator-main">
          <div
            style={{
              flex: '1 1 50%',
              minWidth: 0,
              display: 'flex',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#f5f5f5',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            }}
          >
            <ThreeViewerContainer preview={previewSpec} />
          </div>

          <div
            style={{
              flex: '1 1 50%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid #eee',
                marginBottom: '0.75rem',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => router.back()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#666',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                ←
              </button>
              <SVGIcon src={TYPE_ICONS[selectedType]} className="h-6 w-6" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#1a1a1a',
                    lineHeight: 1.2,
                    textTransform: 'capitalize',
                  }}
                >
                  {t('edit-page-title')} {selectedType}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#999', lineHeight: 1.3 }}>
                  Adjust the listing and see the live technical preview update.
                </span>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '0.5rem',
                paddingBottom: '1rem',
              }}
            >
              <CommonFields form={form} set={set} t={t} selectedType={selectedType} />
            </div>

            <div
              style={{
                flexShrink: 0,
                paddingTop: '0.75rem',
                borderTop: '1px solid #eee',
              }}
            >
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.name}
                className="w-full py-3 text-base font-semibold"
              >
                {submitting ? t('saving') : t('save-changes')}
              </Button>
            </div>
          </div>
        </main>
      )}

      {done && listingId && (
        <main className="w-full max-w-standard-div mx-auto px-4 pb-16 pt-20">
          <SuccessScreen listingId={listingId} t={t} />
        </main>
      )}
    </>
  );
};

export default EditListing;

const getStaticProps = makeStaticProps(['listing-form', 'common']);
export { getStaticPaths, getStaticProps };
