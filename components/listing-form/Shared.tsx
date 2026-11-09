import { useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { SVGIcon } from '@/components/SVGIcon';
import { ListingData, ListingTypes } from '@/lib/elements';
import { TYPE_ICONS } from '@/lib/typeIcons';
import {
  BRICK_COLOURS,
  DOOR_MATERIALS,
  DOOR_TYPES,
  TILE_COLOURS,
  TILE_TYPES,
  WINDOW_TYPES,
  WOOD_TYPES,
} from '@/convex/validators';

// ── Types ────────────────────────────────────────────────────────────────────

export type ListingType = (typeof ListingTypes)[number];
export type WoodType = (typeof WOOD_TYPES)[number];
export type BrickColour = (typeof BRICK_COLOURS)[number];
export type TileColour = (typeof TILE_COLOURS)[number];
export type TileType = (typeof TILE_TYPES)[number];
export type WindowType = (typeof WINDOW_TYPES)[number];
export type DoorType = (typeof DOOR_TYPES)[number];
export type DoorMaterial = (typeof DOOR_MATERIALS)[number];

export { WOOD_TYPES, WINDOW_TYPES, TILE_TYPES, BRICK_COLOURS, TILE_COLOURS, DOOR_TYPES, DOOR_MATERIALS };

// ── Form state ───────────────────────────────────────────────────────────────

export type FormData = {
  name: string;
  imageStorageId: Id<'_storage'> | null;
  existingImageUrl: string | null;
  quantity: number;
  availableFrom: string;
  damage: number;
  hasLocation: boolean;
  lat: string;
  lng: string;
  city: string;
  zipCode: string;
  country: string;
  address: string;
  // bricks
  b_width: number;
  b_height: number;
  b_length: number;
  usedOutside: boolean;
  glazed: boolean;
  brickColour: BrickColour;
  // wood
  w_width: number;
  w_height: number;
  w_length: number;
  structural: boolean;
  outsideUse: boolean;
  woodType: WoodType;
  // window
  win_width: number;
  frameThickness: number;
  windowType: WindowType;
  winWoodType: WoodType;
  // tile
  t_width: number;
  t_length: number;
  thickness: number;
  tileType: TileType;
  tileColour: TileColour;
  // door
  d_width: number;
  d_height: number;
  d_frameThickness: number;
  doorType: DoorType;
  doorMaterial: DoorMaterial;
  doorGlazed: boolean;
};

export const defaultForm: FormData = {
  name: '',
  imageStorageId: null,
  existingImageUrl: null,
  quantity: 10,
  availableFrom: new Date().toISOString().split('T')[0],
  damage: 1,
  hasLocation: false,
  lat: '',
  lng: '',
  city: '',
  zipCode: '',
  country: '',
  address: '',
  b_width: 75,
  b_height: 50,
  b_length: 240,
  usedOutside: false,
  glazed: false,
  brickColour: 'red',
  w_width: 100,
  w_height: 100,
  w_length: 2000,
  structural: false,
  outsideUse: false,
  woodType: 'oak',
  win_width: 1000,
  frameThickness: 50,
  windowType: 'casement',
  winWoodType: 'oak',
  t_width: 300,
  t_length: 300,
  thickness: 20,
  tileType: 'ceramic',
  tileColour: 'white',
  d_width: 900,
  d_height: 2100,
  d_frameThickness: 50,
  doorType: 'interior',
  doorMaterial: 'wood',
  doorGlazed: false
};

// ── Shared field components ──────────────────────────────────────────────────

export const inputClass =
  'border border-gray-200 bg-white px-3 py-2.5 text-sm w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all';
export const selectClass = inputClass;

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</label>
    {children}
    {hint && <span className="text-xs text-gray-400">{hint}</span>}
  </div>
);

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-4">
    <h4
      style={{
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#1a1a1a',
        margin: 0,
        letterSpacing: '-0.01em',
        textAlign: 'left',
      }}
    >
      {title}
    </h4>
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        border: '1px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {children}
    </div>
  </div>
);

export const NumberInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ value, onChange, min, max, step = 1 }) => (
  <input
    type="number"
    className={inputClass}
    value={value}
    min={min}
    max={max}
    step={step}
    onChange={(e) => onChange(Number(e.target.value))}
  />
);

export function SelectInput<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </option>
      ))}
    </select>
  );
}

export const CheckboxInput: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  checked,
  onChange
}) => (
  <label className="flex flex-row items-center gap-2 cursor-pointer text-sm">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4" />
    {label}
  </label>
);

// ── Image upload component ───────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export const ImageUpload: React.FC<{
  onUploaded: (storageId: Id<'_storage'>) => void;
  onCleared: () => void;
  t: (key: string) => string;
  currentImageUrl?: string;
}> = ({ onUploaded, onCleared, t, currentImageUrl }) => {
  const generateUploadUrl = useMutation(api.listings.generateUploadUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>(currentImageUrl ? 'done' : 'idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadState('uploading');

    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { storageId } = (await res.json()) as { storageId: Id<'_storage'> };
      onUploaded(storageId);
      setUploadState('done');
    } catch {
      setUploadState('error');
      setPreviewUrl(null);
      setFileName(null);
    }
  };

  const handleClear = () => {
    setUploadState('idle');
    setPreviewUrl(null);
    setFileName(null);
    onCleared();
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      {previewUrl ? (
        <div className="relative w-full h-48 border border-gray-300 overflow-hidden">
          <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
          {uploadState === 'uploading' && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">{t('uploading')}…</span>
            </div>
          )}
          {uploadState === 'done' && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 bg-white border border-gray-300 px-2 py-1 text-xs shadow hover:bg-gray-50"
            >
              ✕ {t('remove-image')}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors cursor-pointer bg-white"
        >
          <span className="text-2xl">↑</span>
          <span>{t('upload-image')}</span>
          {fileName && <span className="text-xs text-gray-400">{fileName}</span>}
        </button>
      )}

      {uploadState === 'error' && <span className="text-xs text-red-500">{t('upload-error')}</span>}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

// ── Type-specific field sections ─────────────────────────────────────────────

export const BricksFields: React.FC<{
  form: FormData;
  set: (patch: Partial<FormData>) => void;
  t: (k: string) => string;
}> = ({ form, set, t }) => (
  <>
    <Section title={t('geometry')}>
      <div className="grid grid-cols-3 gap-3">
        <Field label={`${t('width')} (30–120)`}>
          <NumberInput value={form.b_width} min={30} max={120} onChange={(v) => set({ b_width: v })} />
        </Field>
        <Field label={`${t('height')} (15–250)`}>
          <NumberInput value={form.b_height} min={15} max={250} onChange={(v) => set({ b_height: v })} />
        </Field>
        <Field label={`${t('length')} (120–600)`}>
          <NumberInput value={form.b_length} min={120} max={600} onChange={(v) => set({ b_length: v })} />
        </Field>
      </div>
    </Section>
    <Section title={t('specifications')}>
      <Field label={t('colour')}>
        <SelectInput value={form.brickColour} options={BRICK_COLOURS} onChange={(v) => set({ brickColour: v })} />
      </Field>
      <CheckboxInput label={t('used-outside')} checked={form.usedOutside} onChange={(v) => set({ usedOutside: v })} />
      <CheckboxInput label={t('glazed')} checked={form.glazed} onChange={(v) => set({ glazed: v })} />
    </Section>
  </>
);

export const WoodFields: React.FC<{
  form: FormData;
  set: (patch: Partial<FormData>) => void;
  t: (k: string) => string;
}> = ({ form, set, t }) => (
  <>
    <Section title={t('geometry')}>
      <div className="grid grid-cols-3 gap-3">
        <Field label={`${t('width')} (50–5000)`}>
          <NumberInput value={form.w_width} min={50} max={5000} onChange={(v) => set({ w_width: v })} />
        </Field>
        <Field label={`${t('height')} (50–5000)`}>
          <NumberInput value={form.w_height} min={50} max={5000} onChange={(v) => set({ w_height: v })} />
        </Field>
        <Field label={`${t('length')} (100–5000)`}>
          <NumberInput value={form.w_length} min={100} max={5000} onChange={(v) => set({ w_length: v })} />
        </Field>
      </div>
    </Section>
    <Section title={t('specifications')}>
      <Field label={t('wood-type')}>
        <SelectInput value={form.woodType} options={WOOD_TYPES} onChange={(v) => set({ woodType: v })} />
      </Field>
      <CheckboxInput label={t('structural')} checked={form.structural} onChange={(v) => set({ structural: v })} />
      <CheckboxInput label={t('outside-use')} checked={form.outsideUse} onChange={(v) => set({ outsideUse: v })} />
    </Section>
  </>
);

export const WindowFields: React.FC<{
  form: FormData;
  set: (patch: Partial<FormData>) => void;
  t: (k: string) => string;
}> = ({ form, set, t }) => (
  <>
    <Section title={t('geometry')}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t('width')} (200–2000)`}>
          <NumberInput value={form.win_width} min={200} max={2000} onChange={(v) => set({ win_width: v })} />
        </Field>
        <Field label={`${t('frame-thickness')} (10–100)`}>
          <NumberInput
            value={form.frameThickness}
            min={10}
            max={100}
            step={0.5}
            onChange={(v) => set({ frameThickness: v })}
          />
        </Field>
      </div>
    </Section>
    <Section title={t('specifications')}>
      <Field label={t('window-type')}>
        <SelectInput value={form.windowType} options={WINDOW_TYPES} onChange={(v) => set({ windowType: v })} />
      </Field>
      <Field label={t('wood-type')}>
        <SelectInput value={form.winWoodType} options={WOOD_TYPES} onChange={(v) => set({ winWoodType: v })} />
      </Field>
    </Section>
  </>
);

export const TileFields: React.FC<{
  form: FormData;
  set: (patch: Partial<FormData>) => void;
  t: (k: string) => string;
}> = ({ form, set, t }) => (
  <>
    <Section title={t('geometry')}>
      <div className="grid grid-cols-3 gap-3">
        <Field label={`${t('width')} (200–2000)`}>
          <NumberInput value={form.t_width} min={200} max={2000} onChange={(v) => set({ t_width: v })} />
        </Field>
        <Field label={`${t('length')} (50–500)`}>
          <NumberInput value={form.t_length} min={50} max={500} onChange={(v) => set({ t_length: v })} />
        </Field>
        <Field label={`${t('thickness')} (10–50)`}>
          <NumberInput value={form.thickness} min={10} max={50} onChange={(v) => set({ thickness: v })} />
        </Field>
      </div>
    </Section>
    <Section title={t('specifications')}>
      <Field label={t('tile-type')}>
        <SelectInput value={form.tileType} options={TILE_TYPES} onChange={(v) => set({ tileType: v })} />
      </Field>
      <Field label={t('colour')}>
        <SelectInput value={form.tileColour} options={TILE_COLOURS} onChange={(v) => set({ tileColour: v })} />
      </Field>
    </Section>
  </>
);

export const DoorFields: React.FC<{
  form: FormData;
  set: (patch: Partial<FormData>) => void;
  t: (k: string) => string;
}> = ({ form, set, t }) => (
  <>
    <Section title={t('geometry')}>
      <div className="grid grid-cols-3 gap-3">
        <Field label={`${t('width')} (600–1200)`}>
          <NumberInput value={form.d_width} min={600} max={1200} onChange={(v) => set({ d_width: v })} />
        </Field>
        <Field label={`${t('height')} (1800–2400)`}>
          <NumberInput value={form.d_height} min={1800} max={2400} onChange={(v) => set({ d_height: v })} />
        </Field>
        <Field label={`${t('frame-thickness')} (10–100)`}>
          <NumberInput
            value={form.d_frameThickness}
            min={10}
            max={100}
            onChange={(v) => set({ d_frameThickness: v })}
          />
        </Field>
      </div>
    </Section>
    <Section title={t('specifications')}>
      <Field label={t('door-type')}>
        <SelectInput value={form.doorType} options={DOOR_TYPES} onChange={(v) => set({ doorType: v })} />
      </Field>
      <Field label={t('door-material')}>
        <SelectInput value={form.doorMaterial} options={DOOR_MATERIALS} onChange={(v) => set({ doorMaterial: v })} />
      </Field>
      <CheckboxInput label={t('glazed')} checked={form.doorGlazed} onChange={(v) => set({ doorGlazed: v })} />
    </Section>
  </>
);

// ── LM Studio AI autofill ────────────────────────────────────────────────────

const LM_STUDIO_BASE_URL = import.meta.env.VITE_LM_STUDIO_BASE_URL ?? 'http://localhost:1234';
const LM_STUDIO_MODEL = import.meta.env.VITE_LM_STUDIO_MODEL ?? 'qwen/qwen3-vl-8b';

async function toBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, b64] = result.split(',');
      resolve({ base64: b64, mimeType: header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildAiPrompt(type: ListingType): string {
  const typeFields: Record<ListingType, string> = {
    bricks: [
      '  "usedOutside": <true if bricks show weathering or outdoor use, false otherwise>',
      '  "glazed": <true if bricks have a glazed/shiny surface, false otherwise>',
      '  "brickColour": <one of: "red", "yellow", "brown">'
    ].join(',\n'),
    wood: [
      '  "woodType": <one of: "cedar", "oak", "pine", "douglas fir", "spruce">',
      '  "structural": <true if the wood appears structural/load-bearing>',
      '  "outsideUse": <true if wood appears suitable for exterior use>'
    ].join(',\n'),
    window: [
      '  "windowType": <one of: "fixed", "sliding", "casement", "awning">',
      '  "winWoodType": <one of: "cedar", "oak", "pine", "douglas fir", "spruce">'
    ].join(',\n'),
    tile: [
      '  "tileType": <one of: "ceramic", "slate", "terracota">',
      '  "tileColour": <one of: "red", "yellow", "blue", "white", "brown", "green">'
    ].join(',\n'),
    door: [
      '  "doorType": <one of: "interior", "exterior", "sliding", "french">',
      '  "doorMaterial": <one of: "wood", "steel", "aluminum", "upvc">',
      '  "doorGlazed": <true if the door has glass panels, false otherwise>'
    ].join(',\n')
  };
  return `You are analysing an image of a second-hand building material for a marketplace listing.
Material type: ${type}
Look at the image carefully and return ONLY a JSON object with these fields:
{
  "name": "A short descriptive title (e.g. 'Reclaimed red clay bricks – minor weathering')",
  "damage": <integer 1-5: 1=perfect, 2=light wear, 3=moderate, 4=significant, 5=heavy>,
${typeFields[type]}
}
Return ONLY valid JSON. No markdown, no explanation.`;
}

function parseAiResponse(json: Record<string, unknown>, type: ListingType): Partial<FormData> {
  const result: Partial<FormData> = {};
  if (typeof json.name === 'string' && json.name) result.name = json.name;
  if (typeof json.damage === 'number') result.damage = Math.min(5, Math.max(1, Math.round(json.damage)));
  switch (type) {
    case 'bricks':
      if (typeof json.usedOutside === 'boolean') result.usedOutside = json.usedOutside;
      if (typeof json.glazed === 'boolean') result.glazed = json.glazed;
      if (BRICK_COLOURS.includes(json.brickColour as BrickColour)) result.brickColour = json.brickColour as BrickColour;
      break;
    case 'wood':
      if (WOOD_TYPES.includes(json.woodType as WoodType)) result.woodType = json.woodType as WoodType;
      if (typeof json.structural === 'boolean') result.structural = json.structural;
      if (typeof json.outsideUse === 'boolean') result.outsideUse = json.outsideUse;
      break;
    case 'window':
      if (WINDOW_TYPES.includes(json.windowType as WindowType)) result.windowType = json.windowType as WindowType;
      if (WOOD_TYPES.includes(json.winWoodType as WoodType)) result.winWoodType = json.winWoodType as WoodType;
      break;
    case 'tile':
      if (TILE_TYPES.includes(json.tileType as TileType)) result.tileType = json.tileType as TileType;
      if (TILE_COLOURS.includes(json.tileColour as TileColour)) result.tileColour = json.tileColour as TileColour;
      break;
    case 'door':
      if (DOOR_TYPES.includes(json.doorType as DoorType)) result.doorType = json.doorType as DoorType;
      if (DOOR_MATERIALS.includes(json.doorMaterial as DoorMaterial))
        result.doorMaterial = json.doorMaterial as DoorMaterial;
      if (typeof json.doorGlazed === 'boolean') result.doorGlazed = json.doorGlazed;
      break;
  }
  return result;
}

async function callLMStudio(imageUrl: string, type: ListingType): Promise<Partial<FormData>> {
  const { base64, mimeType } = await toBase64(imageUrl);
  // In dev: call the local Next.js proxy (pages/api/lm-studio.ts) — no CORS.
  // In production static export this route doesn't exist, so fall back to direct.
  const endpoint =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? '/api/lm-studio'
      : `${LM_STUDIO_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`;

  const basePayload = {
    model: LM_STUDIO_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: buildAiPrompt(type) }
        ]
      }
    ],
    temperature: 0.1
  };

  const post = (body: object) =>
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  let response = await post({ ...basePayload, response_format: { type: 'json_object' } });
  if (response.status >= 400) {
    response = await post(basePayload);
  }
  if (!response.ok) throw new Error(`LM Studio responded with ${response.status}`);

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return parseAiResponse(JSON.parse(jsonMatch[0]) as Record<string, unknown>, type);
}

// ── Type selector ────────────────────────────────────────────────────────────

export const TypeSelector: React.FC<{ onSelect: (t: ListingType) => void; t: (k: string) => string }> = ({
  onSelect,
  t
}) => (
  <div className="flex flex-col gap-6 items-center w-full mt-8">
    <h2 className="text-2xl font-bold opacity-80">{t('select-type')}</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
      {ListingTypes.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="element-card flex flex-col items-center justify-center gap-3 p-6 cursor-pointer hover:bg-gray-50 transition-all bg-white"
        >
          <SVGIcon src={TYPE_ICONS[type]} className="h-10 w-10" />
          <span className="font-semibold capitalize">{type}</span>
        </button>
      ))}
    </div>
  </div>
);

// ── Common form body (shared between add and edit) ───────────────────────────

export const CommonFields: React.FC<{
  form: FormData;
  set: (patch: Partial<FormData>) => void;
  t: (k: string) => string;
  selectedType: ListingType;
}> = ({ form, set, t, selectedType }) => (
  <div className="flex flex-col gap-5 mt-4">
    <Section title={t('basic-info')}>
      <Field label={t('name')}>
        <input
          type="text"
          className={inputClass}
          value={form.name}
          placeholder="e.g. Red clay bricks – lot of 500"
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>
      <Field label={t('image')}>
        <ImageUpload
          onUploaded={(storageId) => set({ imageStorageId: storageId, existingImageUrl: null })}
          onCleared={() => set({ imageStorageId: null, existingImageUrl: null })}
          t={t}
          currentImageUrl={form.existingImageUrl ?? undefined}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t('quantity')} (1–1000)`}>
          <NumberInput value={form.quantity} min={1} max={1000} onChange={(v) => set({ quantity: v })} />
        </Field>
        <Field label={t('available-from')}>
          <input
            type="date"
            className={inputClass}
            value={form.availableFrom}
            onChange={(e) => set({ availableFrom: e.target.value })}
          />
        </Field>
      </div>
      <Field label={`${t('damage')} (1–5)`} hint={t('damage-hint')}>
        <div className="flex flex-row items-center gap-3">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={form.damage}
            onChange={(e) => set({ damage: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="w-5 text-center font-bold">{form.damage}</span>
        </div>
      </Field>
    </Section>

    {selectedType === 'bricks' && <BricksFields form={form} set={set} t={t} />}
    {selectedType === 'wood' && <WoodFields form={form} set={set} t={t} />}
    {selectedType === 'window' && <WindowFields form={form} set={set} t={t} />}
    {selectedType === 'tile' && <TileFields form={form} set={set} t={t} />}
    {selectedType === 'door' && <DoorFields form={form} set={set} t={t} />}

    <Section title={t('location')}>
      <CheckboxInput label={t('add-location')} checked={form.hasLocation} onChange={(v) => set({ hasLocation: v })} />
      {form.hasLocation && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('latitude')}>
              <input
                type="number"
                className={inputClass}
                step="any"
                value={form.lat}
                onChange={(e) => set({ lat: e.target.value })}
              />
            </Field>
            <Field label={t('longitude')}>
              <input
                type="number"
                className={inputClass}
                step="any"
                value={form.lng}
                onChange={(e) => set({ lng: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('city')}>
              <input
                type="text"
                className={inputClass}
                value={form.city}
                onChange={(e) => set({ city: e.target.value })}
              />
            </Field>
            <Field label={t('zip-code')}>
              <input
                type="text"
                className={inputClass}
                value={form.zipCode}
                onChange={(e) => set({ zipCode: e.target.value })}
              />
            </Field>
          </div>
          <Field label={t('country')}>
            <input
              type="text"
              className={inputClass}
              value={form.country}
              onChange={(e) => set({ country: e.target.value })}
            />
          </Field>
          <Field label={t('address')}>
            <input
              type="text"
              className={inputClass}
              value={form.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          </Field>
        </div>
      )}
    </Section>
  </div>
);

// ── Build listing payload from form state ─────────────────────────────────────

export function buildListingPayload(form: FormData, selectedType: ListingType) {
  const location =
    form.hasLocation && form.lat && form.lng
      ? {
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        city: form.city,
        zipCode: form.zipCode,
        country: form.country,
        address: form.address
      }
      : undefined;

  const availableFrom = form.availableFrom ? new Date(form.availableFrom).getTime() : Date.now();
  const imageStorageId = form.imageStorageId ?? undefined;
  const imageUrl = !imageStorageId && form.existingImageUrl ? form.existingImageUrl : undefined;

  const common = {
    name: form.name,
    imageStorageId,
    imageUrl,
    quantity: form.quantity,
    availableFrom,
    damage: form.damage,
    location
  };

  switch (selectedType) {
    case 'bricks':
      return {
        ...common,
        category: 'constructionMaterials' as const,
        type: 'bricks' as const,
        geometry: { width: form.b_width, height: form.b_height, length: form.b_length },
        usedOutside: form.usedOutside,
        glazed: form.glazed,
        colour: form.brickColour
      };
    case 'wood':
      return {
        ...common,
        category: 'constructionMaterials' as const,
        type: 'wood' as const,
        geometry: { width: form.w_width, height: form.w_height, length: form.w_length },
        use: { structural: form.structural, outsideUse: form.outsideUse },
        woodType: form.woodType
      };
    case 'window':
      return {
        ...common,
        category: 'buildingMaterials' as const,
        type: 'window' as const,
        geometry: { width: form.win_width, frameThickness: form.frameThickness },
        woodType: form.winWoodType,
        windowType: form.windowType
      };
    case 'tile':
      return {
        ...common,
        category: 'buildingMaterials' as const,
        type: 'tile' as const,
        geometry: { width: form.t_width, length: form.t_length, thickness: form.thickness },
        tileType: form.tileType,
        colour: form.tileColour
      };
    case 'door':
      return {
        ...common,
        category: 'buildingMaterials' as const,
        type: 'door' as const,
        geometry: { width: form.d_width, height: form.d_height, frameThickness: form.d_frameThickness },
        doorType: form.doorType,
        material: form.doorMaterial,
        glazed: form.doorGlazed
      };
  }
}

// ── Listing → FormData (for edit and table views) ─────────────────────────────

export function listingToForm(listing: ListingData): FormData {
  const base: FormData = {
    ...defaultForm,
    name: listing.name,
    imageStorageId: (listing.imageStorageId as Id<'_storage'> | undefined) ?? null,
    existingImageUrl: listing.imageUrl ?? null,
    quantity: listing.quantity,
    availableFrom: listing.availableFrom
      ? new Date(listing.availableFrom).toISOString().split('T')[0]
      : defaultForm.availableFrom,
    damage: listing.damage,
    hasLocation: !!listing.location,
    lat: listing.location?.lat.toString() ?? '',
    lng: listing.location?.lng.toString() ?? '',
    city: listing.location?.city ?? '',
    zipCode: listing.location?.zipCode ?? '',
    country: listing.location?.country ?? '',
    address: listing.location?.address ?? ''
  };

  switch (listing.type) {
    case 'bricks':
      return {
        ...base,
        b_width: listing.geometry.width,
        b_height: listing.geometry.height,
        b_length: listing.geometry.length,
        usedOutside: listing.usedOutside,
        glazed: listing.glazed,
        brickColour: listing.colour
      };
    case 'wood':
      return {
        ...base,
        w_width: listing.geometry.width,
        w_height: listing.geometry.height,
        w_length: listing.geometry.length,
        structural: listing.use.structural,
        outsideUse: listing.use.outsideUse,
        woodType: listing.woodType
      };
    case 'window':
      return {
        ...base,
        win_width: listing.geometry.width,
        frameThickness: listing.geometry.frameThickness,
        windowType: listing.windowType,
        winWoodType: listing.woodType
      };
    case 'tile':
      return {
        ...base,
        t_width: listing.geometry.width,
        t_length: listing.geometry.length,
        thickness: listing.geometry.thickness,
        tileType: listing.tileType,
        tileColour: listing.colour
      };
    case 'door':
      return {
        ...base,
        d_width: listing.geometry.width,
        d_height: listing.geometry.height,
        d_frameThickness: listing.geometry.frameThickness,
        doorType: listing.doorType,
        doorMaterial: listing.material,
        doorGlazed: listing.glazed
      };
  }
}
