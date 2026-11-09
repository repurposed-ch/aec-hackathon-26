import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery } from 'convex/react';
import { useTranslation } from 'react-i18next';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/Button';
import { SVGIcon } from '@/components/SVGIcon';
import {
  type ListingType,
  type FormData,
  defaultForm,
  buildListingPayload,
  listingToForm,
} from '@/components/listing-form/Shared';
import { ListingForm } from '@/components/listing-form/ListingForm';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const updateListing = useMutation(api.listings.update);

  const listingId = (searchParams.get('id') ?? undefined) as Id<'listings'> | undefined;

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

  const isLoading = listingId !== undefined && listing === undefined;
  const selectedType = listing?.type as ListingType | undefined;

  return (
    <>
      <Navigation
        links={[
          { href: 'all-elements', text: 'to-all-elements', icon: <SVGIcon src={cart} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home} /> },
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
        <ListingForm
          type={selectedType}
          form={form}
          set={set}
          t={t}
          title={t('edit-page-title')}
          subtitle="Adjust the listing and see the live technical preview update."
          submitLabel={t('save-changes')}
          submittingLabel={t('saving')}
          submitting={submitting}
          onSubmit={handleSubmit}
          onBack={() => navigate(-1)}
        />
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
