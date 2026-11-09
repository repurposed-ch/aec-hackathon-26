import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import i18n, { LOCALES } from './i18n';
import NotFound from './routes/NotFound';

const Home = lazy(() => import('./routes/Home'));
const AllElements = lazy(() => import('./routes/all-elements'));
const Elements = lazy(() => import('./routes/elements'));
const Favorites = lazy(() => import('./routes/favorites'));
const TinderSlides = lazy(() => import('./routes/tinder-slides'));
const AreaComposer = lazy(() => import('./routes/area-composer'));
const ListingsTable = lazy(() => import('./routes/listings-table'));
const AddListing = lazy(() => import('./routes/add-listing'));
const EditListing = lazy(() => import('./routes/edit-listing'));

/** Old links (and printed QR codes) look like /en/elements/?id=… — switch language and drop the prefix. */
const LegacyLocaleRedirect = () => {
  const { locale, '*': rest } = useParams();
  const { search } = useLocation();
  if (!(LOCALES as readonly string[]).includes(locale ?? '')) return <NotFound />;
  void i18n.changeLanguage(locale);
  return <Navigate to={`/${rest ?? ''}${search}`} replace />;
};

export const App = () => (
  <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/all-elements" element={<AllElements />} />
      <Route path="/elements" element={<Elements />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/tinder-slides" element={<TinderSlides />} />
      <Route path="/area-composer" element={<AreaComposer />} />
      <Route path="/listings-table" element={<ListingsTable />} />
      <Route path="/add-listing" element={<AddListing />} />
      <Route path="/edit-listing" element={<EditListing />} />
      <Route path="/:locale/*" element={<LegacyLocaleRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);
