import { useRepurposedStore } from '@/lib/store';
import brokenHeart from '/assets/icons/heart_broken.svg';
import heart from '/assets/icons/heart.svg';
import { SVGIcon } from '@/components/SVGIcon';
import { Button } from '@/components/Button';
import { ListingData } from '@/lib/elements';
import { CardDetailLevel } from '@/lib/cardContent';
import { useTranslation } from 'react-i18next';

export const LikeButton: React.FC<{ element: ListingData; detailLevel: (typeof CardDetailLevel)[number] }> = ({
  element,
  detailLevel
}) => {
  const { t } = useTranslation('common');

  const likedElements = useRepurposedStore((state) => state.liked);
  const isLiked = likedElements.has(element._id);

  const toggleLike = () => {
    if (isLiked) useRepurposedStore.getState().removeLiked(element._id);
    else useRepurposedStore.getState().addLiked(element._id);
  };

  return detailLevel === 'content' ? (
    <Button onClick={toggleLike}>
      <SVGIcon src={isLiked ? heart : brokenHeart} className="h-5 my-auto" />
      {t('favorites')}
    </Button>
  ) : (
    <SVGIcon
      onClick={toggleLike}
      src={isLiked ? heart : brokenHeart}
      className="h-5 my-auto cursor-pointer hover:scale-110 transition-all duration-300"
    />
  );
};
