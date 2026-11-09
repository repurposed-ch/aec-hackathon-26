import { useTranslation } from 'react-i18next';
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic';
import { Navigation } from '@/components/Navigation';

import { useState } from 'react';
import { TinderCard } from '@/components/TinderCard';
import { useRepurposedStore } from '@/lib/store';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import { SVGIcon } from '@/components/SVGIcon';
import heart from '/assets/icons/heart.svg';
import cart from '/assets/icons/shopping_cart.svg';
import home from '/assets/icons/home.svg';

export const TinderSlides = () => {
  const { t } = useTranslation(['common']);
  const [activeIndex, setActiveIndex] = useState(0);
  const listings = useQuery(api.listings.list) ?? [];

  const onLike = (index: number) => {
    const listing = listings[index];
    if (listing) useRepurposedStore.getState().addLiked(listing._id);
    setActiveIndex((prev) => prev + 1);
  };

  const onDislike = (index: number) => {
    const listing = listings[index];
    if (listing) useRepurposedStore.getState().addDisliked(listing._id);
    setActiveIndex((prev) => prev + 1);
  };

  return (
    <>
      <Navigation
        links={[
          { href: 'favorites', text: 'to-favorites', icon: <SVGIcon src={heart.src} /> },
          { href: 'all-elements', text: 'to-all-elements', icon: <SVGIcon src={cart.src} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home.src} /> }
        ]}
        withoutTopMargin
      />
      <main className="bg-white-900 w-[100vw]">
        <div className="overflow-clip flex items-center justify-center touch-none w-[100vw] h-[100vh] mt-[calc(100svh-100vh)]">
          <div className="relative w-[min(85svw,600px)] h-[min(80svh,800px)]">
            {listings[activeIndex + 1] ? (
              <TinderCard
                active={false}
                key={activeIndex + 1}
                url={listings[activeIndex + 1].imageUrl ?? ''}
                index={activeIndex + 1}
                onLike={() => onLike(activeIndex + 1)}
                onDislike={() => onDislike(activeIndex + 1)}
                name={t('this-is-an-element')}
              />
            ) : null}
            {listings[activeIndex] ? (
              <TinderCard
                active
                key={activeIndex}
                url={listings[activeIndex].imageUrl ?? ''}
                index={activeIndex}
                onLike={() => onLike(activeIndex)}
                onDislike={() => onDislike(activeIndex)}
                name={t('this-is-an-element')}
              />
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
};

export default TinderSlides;

const getStaticProps = makeStaticProps(['common', 'navigation']);
export { getStaticPaths, getStaticProps };
