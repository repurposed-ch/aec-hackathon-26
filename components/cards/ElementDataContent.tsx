import { ListingData } from '@/lib/elements';
import { BuildingTypology } from './cardData/BuildingTypology';
import { ElementTypology } from './cardData/ElementTypology';
import { CardDetailLevel } from '@/lib/cardContent';
import { DimensionValues } from './DimensionValues';
import { IconText } from './cardData/IconText';
import { SVGIcon } from '../SVGIcon';
import amount from '/assets/icons/amount.svg';

export const ElementDataContent: React.FC<{ element: ListingData; detailLevel: (typeof CardDetailLevel)[number] }> = (
  props
) => {
  const sizeClass = props.detailLevel === 'content' ? 'h-6 text-sm' : 'h-[.875rem] text-xs';

  return (
    <div
      className={`flex gap-[.2rem] w-full h-full justify-end ${
        props.detailLevel === 'content' ? 'flex-col items-start' : 'flex-row items-center'
      }`}
    >
      <DimensionValues sizeClass={sizeClass} {...props} />
      <BuildingTypology {...props} sizeClass={sizeClass} />
      <ElementTypology {...props} sizeClass={sizeClass} />
      {props.detailLevel === 'content' ? (
        <IconText
          icon={<SVGIcon src={amount} className={sizeClass} />}
          text={props.element.quantity.toString()}
          sizeClass={sizeClass}
        />
      ) : (
        <span className={sizeClass}>{props.element.quantity}</span>
      )}
    </div>
  );
};
