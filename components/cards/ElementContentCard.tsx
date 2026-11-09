import { useState, useCallback, useEffect, useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import { SVGIcon } from '@/components/SVGIcon';
import { Map } from '@/components/leaflet/LazyMap';
import { ThreeViewerContainer } from '@/components/viewers/ThreeViewerContainer';
import cart from '/assets/icons/shopping_cart.svg';
import { ICardContentProps } from '@/lib/cardContent';
import { ListingData } from '@/lib/elements';
import { buildListingPreviewSpecFromListing } from '@/lib/openplans/listingPreview';
import { generateListingDrawingSet } from '@/lib/openplans/client';
import { ElementDataContent } from './ElementDataContent';
import { CardPDFDocument } from './CardPDFDocument';
import { Button } from '../Button';
import { LikeButton } from './cardData/LikeButton';

const EMAIL = 'info@jonasward.ch';

const getMailTo = (element: ListingData) =>
  `mailto:${EMAIL}?subject=Listing ${element.name}&body=I am interested in the listing ${element.name} (${element.type}). I would like to know more about it and how to purchase it.`;

// ── PDF preview modal ─────────────────────────────────────────────────────────

interface PDFModalProps {
  blobUrl: string;
  filename: string;
  onClose: () => void;
}

const PDFModal: React.FC<PDFModalProps> = ({ blobUrl, filename, onClose }) => (
  <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={onClose}>
    {/* Panel */}
    <div
      className="mt-auto bg-white w-full max-h-[90svh] flex flex-col rounded-t-2xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
        <span className="text-sm font-semibold text-gray-800 truncate">{filename}</span>
        <div className="flex items-center gap-3">
          <a
            href={blobUrl}
            download={filename}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ⬇ Download
          </a>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <iframe title={filename} src={blobUrl} className="w-full h-[80svh] border-0" />
      </div>
    </div>
  </div>
);

// ── Card ──────────────────────────────────────────────────────────────────────

export const ElementContentCard: React.FC<ICardContentProps & { highlighted?: boolean }> = ({ element, highlighted }) => {
  const { t } = useTranslation('common');
  const locatedElements = element.location ? [element] : [];
  const previewSpec = useMemo(() => buildListingPreviewSpecFromListing(element), [element]);

  const [pdfState, setPdfState] = useState<
    { status: 'idle' } | { status: 'generating' } | { status: 'ready'; url: string }
  >({ status: 'idle' });
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const ensurePdfPreview = useCallback(async () => {
    if (pdfState.status === 'ready') {
      return pdfState.url;
    }
    if (pdfState.status === 'generating') {
      return null;
    }
    setPdfState({ status: 'generating' });
    try {
      const elementUrl = `${window.location.origin}/${window.location.pathname.split('/')[1]}/elements/?id=${element._id}`;
      const qrDataUrl = await QRCode.toDataURL(elementUrl, { width: 160, margin: 1 });
      const technicalDrawings = await generateListingDrawingSet(previewSpec);
      const blob = await pdf(
        <CardPDFDocument element={element} qrDataUrl={qrDataUrl} technicalDrawings={technicalDrawings} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfState({ status: 'ready', url });
      return url;
    } catch {
      setPdfState({ status: 'idle' });
      return null;
    }
  }, [element, pdfState.status, previewSpec]);

  const handlePDF = useCallback(async () => {
    const url = await ensurePdfPreview();
    if (url) {
      setIsPdfModalOpen(true);
    }
  }, [ensurePdfPreview]);

  const handleClose = useCallback(() => {
    setIsPdfModalOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (pdfState.status === 'ready') {
        URL.revokeObjectURL(pdfState.url);
      }
    };
  }, [pdfState]);

  const filename = `${element.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;

  return (
    <>
      <div data-listing-id={element._id} className={`element-card grid w-full grid-cols-[1fr] md:grid-cols-[1fr_1fr] flex-col items-center overflow-clip shadow-xl mx-auto gap-4 ${highlighted ? 'highlighted' : ''}`}>
        <div className="relative w-full h-[calc(min(50vh,20rem))] md:h-120">
          <ThreeViewerContainer
            preview={previewSpec}
            className="h-full"
            minHeight="100%"
            pdfPreview={{
              source: pdfState.status === 'ready' ? pdfState.url : null,
              status: pdfState.status,
              ensureSource: ensurePdfPreview,
            }}
          />
        </div>
        <div className="my-auto p-3 font-bold flex flex-col items-start justify-between w-full gap-4 shadow-none h-full">
          <h3 className="md:pt-4">{t(`element-type:${element.type}`)}</h3>
          <div className="grid w-full grid-cols-[1fr_auto] gap-5">
            {locatedElements.length > 0 && <Map className="w-full h-50" elements={locatedElements} />}
            <ElementDataContent element={element} detailLevel="content" />
          </div>
          <div className="grid grid-cols-3 gap-2 justify-between w-full">
            <LikeButton element={element} detailLevel="content" />
            <button
              onClick={handlePDF}
              disabled={pdfState.status === 'generating'}
              className="px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:border-gray-800 hover:text-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {pdfState.status === 'generating' ? (
                <>
                  <span className="w-3.5 h-3.5 border border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>PDF</span>
                </>
              )}
            </button>
            <Button href={getMailTo(element)} tooltip={'Demo Mode'} disabled dontLocalizedHref>
              <SVGIcon src={cart.src} className="h-4 my-auto" />
              {t('buy')}
            </Button>
          </div>
        </div>
      </div>

      {/* PDF preview modal (portal-style, renders outside card DOM) */}
      {isPdfModalOpen && pdfState.status === 'ready' && (
        <PDFModal blobUrl={pdfState.url} filename={filename} onClose={handleClose} />
      )}
    </>
  );
};
