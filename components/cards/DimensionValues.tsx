import { ListingData } from '@/lib/elements';
import { SVGIcon } from '../SVGIcon';
import length from '/assets/icons/length.svg';
import axii from '/assets/icons/axii.svg';
import { CardDetailLevel } from '@/lib/cardContent';

export const DimensionValues: React.FC<{
  element: ListingData;
  sizeClass?: string;
  detailLevel: (typeof CardDetailLevel)[number];
}> = ({ element, sizeClass, detailLevel }) => {
  const spanClass = `flex flex-row ${detailLevel === 'content' ? 'gap-2' : 'gap-[0.175rem]'} items-center`;
  const { geometry } = element;

  const cross =
    'width' in geometry && 'height' in geometry
      ? `${geometry.width.toFixed(0)}x${geometry.height.toFixed(0)}`
      : 'width' in geometry && 'frameThickness' in geometry
        ? `${geometry.width.toFixed(0)}x${geometry.frameThickness.toFixed(0)}`
        : `${(geometry as any).width?.toFixed(0) ?? '—'}`;

  const long =
    'length' in geometry
      ? (geometry as any).length.toFixed(0)
      : 'thickness' in geometry
        ? (geometry as any).thickness.toFixed(0)
        : '—';

  return (
    <div className={`flex flex-col gap-1`}>
      <span className={spanClass}>
        <SVGIcon src={axii} className={sizeClass} />
        <span className={sizeClass}>{cross}</span>
      </span>
      <span className={spanClass}>
        <SVGIcon src={length} className={sizeClass} />
        <span className={sizeClass}>{long}</span>
      </span>
    </div>
  );
};
