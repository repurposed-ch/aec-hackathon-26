import { useSearchParams } from 'react-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Navigation } from '@/components/Navigation';
import { ElementContentCard } from '@/components/cards/ElementContentCard';
import { SVGIcon } from '@/components/SVGIcon';

import heart from '/assets/icons/heart.svg';
import home from '/assets/icons/home.svg';
import edit from '/assets/icons/customize.svg';

export const Element = () => {
  const [searchParams] = useSearchParams();
  const listingId = (searchParams.get('id') ?? undefined) as Id<'listings'> | undefined;

  const listing = useQuery(
    api.listings.getById,
    listingId ? { id: listingId } : 'skip'
  );

  const isLoading = listingId !== undefined && listing === undefined;

  return (
    <>
      <Navigation
        links={[
          ...(listingId ? [{ href: `edit-listing?id=${listingId}`, text: 'edit-listing', icon: <SVGIcon src={edit} /> }] : []),
          { href: 'favorites', text: 'to-favorites', icon: <SVGIcon src={heart} /> },
          { href: '/', text: 'back-to-home', icon: <SVGIcon src={home} /> },
        ]}
      />
      <main className="w-[calc(min(100vw,1200px)-50px)] mx-auto">
        <div className="mt-[65px] w-[calc(min(100vw,1200px)-50px)]">
          {isLoading && (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Loading…
            </div>
          )}
          {!isLoading && listing && <ElementContentCard element={listing} />}
          {!isLoading && !listing && listingId && (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Listing not found.
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Element;
