import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage').then((m) => ({ default: m.SearchResultsPage })));
const MedicineDetailPage = lazy(() => import('./pages/MedicineDetailPage').then((m) => ({ default: m.MedicineDetailPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then((m) => ({ default: m.ComparePage })));
const AlternativesPage = lazy(() => import('./pages/AlternativesPage').then((m) => ({ default: m.AlternativesPage })));
const ImageAnalysisPage = lazy(() => import('./pages/ImageAnalysisPage').then((m) => ({ default: m.ImageAnalysisPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then((m) => ({ default: m.FAQPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64 py-20">
      <LoadingSpinner size="lg" text="جارٍ التحميل..." />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/search" element={<Layout><SearchPage /></Layout>} />
          <Route path="/results" element={<Layout><SearchResultsPage /></Layout>} />
          <Route path="/medicine/:id" element={<Layout><MedicineDetailPage /></Layout>} />
          <Route path="/compare" element={<Layout><ComparePage /></Layout>} />
          <Route path="/alternatives/:id" element={<Layout><AlternativesPage /></Layout>} />
          <Route path="/alternatives" element={<Navigate to="/search" replace />} />
          <Route path="/analysis" element={<Layout><ImageAnalysisPage /></Layout>} />
          <Route path="/favorites" element={<Layout><FavoritesPage /></Layout>} />
          <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
          <Route path="/about" element={<Layout><AboutPage /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
          <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
          <Route path="/404" element={<Layout><NotFoundPage /></Layout>} />
          <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
