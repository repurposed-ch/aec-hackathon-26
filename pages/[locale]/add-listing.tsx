import { useMemo, useState } from 'react';
import { useMutation } from 'convex/react';
import { useTranslation } from 'next-i18next';
import { api } from '@/convex/_generated/api';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/Button';
import { SVGIcon } from '@/components/SVGIcon';
import { ThreeViewerContainer } from '@/components/viewers/ThreeViewerContainer';
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic';
import { buildListingPreviewSpecFromForm } from '@/lib/openplans/listingPreview';
import {
  type ListingType,
  type FormData,
  defaultForm,
  TYPE_ICONS,
  CommonFields,
  TypeSelector,
  buildListingPayload,
} from '@/components/listing-form/Shared';

import home from '/assets/icons/home.svg';
import cart from '/assets/icons/shopping_cart.svg';

// ── Success screen ────────────────────────────────────────────────────────────

const SuccessScreen: React.FC<{ onAddAnother: () => void; t: (k: string) => string }> = ({ onAddAnother, t }) => (
  <div className="flex flex-col items-center gap-6 py-16">
    <div className="text-5xl">✓</div>
    <h2 className="text-2xl font-bold">{t('success-title')}</h2>
    <p className="text-gray-600">{t('success-message')}</p>
    <div className="flex flex-row gap-4">
      <Button onClick={onAddAnother}>{t('add-another')}</Button>
      <Button href="/all-elements">{t('view-all')}</Button>
    </div>
  </div>
);

// ── Main page ────────────────────────────────────────────────────────────────

const AddListing: React.FC = () => {
  const { t } = useTranslation('listing-form');
  const createListing = useMutation(api.listings.create);

  const [step, setStep] = useState<'type-select' | 'form' | 'success'>('type-select');
  const [selectedType, setSelectedType] = useState<ListingType | null>(null);
  const [form, setFormRaw] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<FormData>) => setFormRaw((prev) => ({ ...prev, ...patch }));
  const previewSpec = useMemo(
    () => (selectedType ? buildListingPreviewSpecFromForm(form, selectedType) : null),
    [form, selectedType],
  );

  const handleSelectType = (type: ListingType) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    setSubmitting(true);
    try {
      await createListing({ data: buildListingPayload(form, selectedType) });
      setStep('success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navigation
        links={[
          { href: 'all-elements', text: 'to-all-elements', icon: <SVGIcon src={cart.src} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home.src} /> },
        ]}
        withoutTopMargin
      />

      {/* ── Type selection & success: full-width centered ── */}
      {step === 'type-select' && (
        <main className="w-full max-w-standard-div mx-auto px-4 pb-16 pt-20">
          <TypeSelector onSelect={handleSelectType} t={t} />
        </main>
      )}

      {step === 'success' && (
        <main className="w-full max-w-standard-div mx-auto px-4 pb-16 pt-20">
          <SuccessScreen
            onAddAnother={() => {
              setFormRaw(defaultForm);
              setSelectedType(null);
              setStep('type-select');
            }}
            t={t}
          />
        </main>
      )}

      {/* ── Form step: two-column configurator layout ───── */}
      {step === 'form' && selectedType && (
        <main className="configurator-main">
          {/* ── Left: 3D Viewer ──────────────────────────── */}
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

          {/* ── Right: Configurator panel ─────────────────── */}
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
            {/* ── Header ──────────────────────────────────── */}
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
                onClick={() => setStep('type-select')}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#ccc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#e0e0e0';
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
                  {t('configure')} {selectedType}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#999', lineHeight: 1.3 }}>
                  Choose options and customize your listing
                </span>
              </div>
            </div>

            {/* ── Scrollable form content ─────────────────── */}
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

            {/* ── Submit bar ──────────────────────────────── */}
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
                {submitting ? t('submitting') : t('submit')}
              </Button>
            </div>
          </div>
        </main>
      )}
    </>
  );
};

export default AddListing;

const getStaticProps = makeStaticProps(['listing-form', 'common']);
export { getStaticPaths, getStaticProps };
