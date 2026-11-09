import { appWithTranslation } from 'next-i18next';
import './globals.css';
import { useEffect } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useRepurposedStore, LOCAL_STORAGE_KEY_LIKED, LOCAL_STORAGE_KEY_DISLIKED } from '@/lib/store';

const convex = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)
  : null;

const RepurposedMarketplace = ({ Component, pageProps }: { Component: any; pageProps: any }) => {
  useEffect(() => {
    if (localStorage.getItem(LOCAL_STORAGE_KEY_LIKED)) {
      useRepurposedStore.setState(() => ({
        liked: new Set(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LIKED)!) as Id<'listings'>[])
      }));
    }
    if (localStorage.getItem(LOCAL_STORAGE_KEY_DISLIKED)) {
      useRepurposedStore.setState(() => ({
        disliked: new Set(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_DISLIKED)!) as Id<'listings'>[])
      }));
    }
  }, []);

  if (!convex) return <Component {...pageProps} />;

  return (
    <ConvexProvider client={convex}>
      <Component {...pageProps} />
    </ConvexProvider>
  );
};

export default appWithTranslation(RepurposedMarketplace);
