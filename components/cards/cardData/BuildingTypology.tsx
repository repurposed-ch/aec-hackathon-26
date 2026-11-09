import { SVGIcon } from '@/components/SVGIcon';
import { ListingCategories, ListingData } from '@/lib/elements';
import constructionMaterials from '/assets/icons/building-typology/construction-materials.svg';
import buildingMaterials from '/assets/icons/building-typology/building-materials.svg';
import { useTranslation } from 'react-i18next';
import { CardDetailLevel } from '@/lib/cardContent';
import { IconText } from './IconText';

export const BuildingTypology: React.FC<{
  element: ListingData;
  detailLevel: (typeof CardDetailLevel)[number];
  sizeClass?: string;
}> = ({ element, detailLevel, sizeClass }) => {
  const { t } = useTranslation('building-type');

  return detailLevel === 'content' ? (
    <IconText
      icon={<BuildingTypologyIcon category={element.category} sizeClass={sizeClass} />}
      text={t(element.category)}
      sizeClass={sizeClass}
    />
  ) : (
    <BuildingTypologyIcon category={element.category} sizeClass={sizeClass} />
  );
};

const BuildingTypologyIcon: React.FC<{ category: (typeof ListingCategories)[number]; sizeClass?: string }> = ({
  category,
  sizeClass
}) => {
  switch (category) {
    case 'constructionMaterials':
      return <SVGIcon src={constructionMaterials} className={sizeClass} />;
    case 'buildingMaterials':
      return <SVGIcon src={buildingMaterials} className={sizeClass} />;
  }
};
