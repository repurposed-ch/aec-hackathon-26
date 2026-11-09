import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useRepurposedStore, LOCAL_STORAGE_KEY_LIKED, LOCAL_STORAGE_KEY_DISLIKED } from '@/lib/store';
import { App } from './App';
import './i18n';
import './globals.css';

const readIds = (key: string) => {
  const raw = localStorage.getItem(key);
  return raw ? new Set(JSON.parse(raw) as Id<'listings'>[]) : new Set<Id<'listings'>>();
};
useRepurposedStore.setState({
  liked: readIds(LOCAL_STORAGE_KEY_LIKED),
  disliked: readIds(LOCAL_STORAGE_KEY_DISLIKED)
});

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const app = (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <App />
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(
  convexUrl ? <ConvexProvider client={new ConvexReactClient(convexUrl)}>{app}</ConvexProvider> : app
);
