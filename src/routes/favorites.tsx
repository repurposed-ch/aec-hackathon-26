import { useTranslation } from 'react-i18next';

import { useRepurposedStore } from '@/lib/store';
import { Navigation } from '@/components/Navigation';
import { SVGIcon } from '@/components/SVGIcon';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import cart from '/assets/icons/shopping_cart.svg';
import home from '/assets/icons/home.svg';
import { CardRenderer } from '@/components/cards/CardRenderer';
import { useMemo } from 'react';

const Favorites: React.FC = () => {
  const { t } = useTranslation(['common', 'footer']);
  const liked = useRepurposedStore((s) => s.liked);
  const listings = useQuery(api.listings.list) ?? [];

  const elements = useMemo(
    () => listings.filter((listing) => liked.has(listing._id)),
    [liked, listings]
  );

  return (
    <>
      <Navigation
        links={[
          { href: 'all-elements', text: 'to-all-elements', icon: <SVGIcon src={cart} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home} /> }
        ]}
        withoutTopMargin
      />
      {elements.length ? (
        <div className="w-full h-[100svh] grid grid-rows-[1fr_auto] max-w-standard-div">
          <p className="mt-[75px] h-[25px]">{t('your-favorites')}</p>
          <CardRenderer className="h-[calc(100svh-100px)]" detailLevel="content" elements={elements} />
        </div>
      ) : (
        <p className="mt-[75px] h-[25px]">{t('no-favorites')}</p>
      )}
    </>
  );
};

export default Favorites;
