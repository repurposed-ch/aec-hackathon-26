import { useMemo } from 'react';
import { Button } from '@/components/Button';
import { SVGIcon } from '@/components/SVGIcon';
import { ThreeViewerContainer } from '@/components/viewers/ThreeViewerContainer';
import { buildListingPreviewSpecFromForm } from '@/lib/openplans/listingPreview';
import { TYPE_ICONS } from '@/lib/typeIcons';
import { CommonFields, type FormData, type ListingType } from './Shared';

/** Two-column configurator: live 3D preview on the left, form on the right. */
export const ListingForm: React.FC<{
  type: ListingType;
  form: FormData;
  set: (patch: Partial<FormData>) => void;
  t: (k: string) => string;
  title: string;
  subtitle: string;
  submitLabel: string;
  submittingLabel: string;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}> = ({ type, form, set, t, title, subtitle, submitLabel, submittingLabel, submitting, onSubmit, onBack }) => {
  const previewSpec = useMemo(() => buildListingPreviewSpecFromForm(form, type), [form, type]);

  return (
    <main className="configurator-main">
      <div className="flex-[1_1_50%] min-w-0 flex rounded-[20px] overflow-hidden bg-[#f5f5f5] shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <ThreeViewerContainer preview={previewSpec} />
      </div>

      <div className="flex-[1_1_50%] min-w-0 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-3 py-3 border-b border-[#eee] mb-3 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#e0e0e0] bg-white cursor-pointer text-sm text-[#666] transition-all shrink-0 hover:bg-[#f5f5f5] hover:border-[#ccc]"
          >
            ←
          </button>
          <SVGIcon src={TYPE_ICONS[type]} className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[#1a1a1a] leading-[1.2] capitalize">
              {title} {type}
            </span>
            <span className="text-[0.8rem] text-[#999] leading-[1.3]">{subtitle}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          <CommonFields form={form} set={set} t={t} selectedType={type} />
        </div>

        <div className="shrink-0 pt-3 border-t border-[#eee]">
          <Button onClick={onSubmit} disabled={submitting || !form.name} className="w-full py-3 text-base font-semibold">
            {submitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </main>
  );
};
