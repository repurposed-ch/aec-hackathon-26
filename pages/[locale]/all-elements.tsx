import { Navigation } from '@/components/Navigation';
import { Map } from '@/components/leaflet/LazyMap';
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic';
import { SVGIcon } from '@/components/SVGIcon';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import heart from '/assets/icons/heart.svg';
import home from '/assets/icons/home.svg';
import add from '/assets/icons/customize.svg';
import { CardRenderer } from '@/components/cards/CardRenderer';

export const AllElements = () => {
  const listings = useQuery(api.listings.list) ?? [];

  return (
    <>
      <Navigation
        links={[
          { href: 'add-listing', text: 'add-listing', icon: <SVGIcon src={add.src} /> },
          { href: 'favorites', text: 'to-favorites', icon: <SVGIcon src={heart.src} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home.src} /> }
        ]}
        withoutTopMargin
      />
      <div className="w-full h-[100svh] grid grid-rows-[1fr_auto] overflow-visible max-w-standard-div">
        <div className="standard-padding w-full">
          <Map className="w-full h-[35svh] z-1" elements={listings} />
        </div>
        <CardRenderer className="h-[65svh]" elements={listings} />
      </div>
    </>
  );
};

export default AllElements;

const getStaticProps = makeStaticProps(['all-elements', 'common', 'building-type', 'element-type']);
export { getStaticPaths, getStaticProps };
