import { SVGIcon } from '@/components/SVGIcon';
import { ListingData, ListingTypes } from '@/lib/elements';
import bricks from '/assets/icons/element-typology/bricks.svg';
import wood from '/assets/icons/element-typology/wood.svg';
import window from '/assets/icons/element-typology/window.svg';
import tile from '/assets/icons/element-typology/tile.svg';
import door from '/assets/icons/element-typology/door.svg';
import { useTranslation } from 'react-i18next';
import { CardDetailLevel } from '@/lib/cardContent';
import { IconText } from './IconText';

export const ElementTypology: React.FC<{
  element: ListingData;
  detailLevel: (typeof CardDetailLevel)[number];
  sizeClass?: string;
}> = ({ element, detailLevel, sizeClass }) => {
  const { t } = useTranslation('element-type');

  return detailLevel === 'content' ? (
    <IconText
      icon={<ElementTypologyIcon listingType={element.type} sizeClass={sizeClass} />}
      text={t(element.type)}
      sizeClass={sizeClass}
    />
  ) : (
    <ElementTypologyIcon listingType={element.type} sizeClass={sizeClass} />
  );
};

const ElementTypologyIcon: React.FC<{ listingType: (typeof ListingTypes)[number]; sizeClass?: string }> = ({
  listingType,
  sizeClass
}) => {
  switch (listingType) {
    case 'bricks':
      return <SVGIcon src={bricks} className={sizeClass} />;
    case 'wood':
      return <SVGIcon src={wood} className={sizeClass} />;
    case 'window':
      return <SVGIcon src={window} className={sizeClass} />;
    case 'tile':
      return <SVGIcon src={tile} className={sizeClass} />;
    case 'door':
      return <SVGIcon src={door} className={sizeClass} />;
  }
};
