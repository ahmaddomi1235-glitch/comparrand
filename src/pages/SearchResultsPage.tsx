import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { medicineService } from '../services/medicineService';
import { searchHistoryService } from '../services/searchHistoryService';
import {
  searchMedicineWithGemini,
  isGeminiConfigured,
  type GeminiSearchResult,
} from '../services/GIMINI';
import { useFavorites } from '../hooks/useFavorites';
import { useComparison } from '../hooks/useComparison';
import { MedicineCard } from '../components/medicine/MedicineCard';
import { SearchBar } from '../components/medicine/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ROUTES } from '../constants';

function AIResults({
  result,
  onSearch,
}: {
  result: GeminiSearchResult;
  onSearch: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!result.suggestions.length) return null;

  return (
    <div className="mt-6 border border-primary/30 rounded-card bg-primary-light/20 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-primary-light/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span className="font-semibold text-text-main">
            اقتراحات الذكاء الاصطناعي لـ &quot;{result.query}&quot;
          </span>
          {result.interpretedMedicineName && result.interpretedMedicineName !== result.query && (
            <span className="text-xs text-text-secondary bg-bg-surface border border-border-light px-2 py-0.5 rounded-full">
              {result.interpretedMedicineName}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {result.jordanMarketHint && (
            <p className="text-xs text-text-secondary italic">{result.jordanMarketHint}</p>
          )}
          {result.suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-bg-surface border border-border-default rounded-card p-4 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="flex-1 space-y-1">
                <p className="font-bold text-text-main">{s.medicineName}</p>
                {s.genericName && (
                  <p className="text-sm text-text-secondary">
                    المادة الفعالة: <span className="font-medium">{s.genericName}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-text-secondary mt-1">
                  {s.strength && <span className="bg-border-light px-2 py-0.5 rounded-full">{s.strength}</span>}
                  {s.dosageForm && <span className="bg-border-light px-2 py-0.5 rounded-full">{s.dosageForm}</span>}
                  {s.manufacturer && <span className="bg-border-light px-2 py-0.5 rounded-full">{s.manufacturer}</span>}
                  {s.estimatedJordanPriceJOD && (
                    <span className="bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                      {s.estimatedJordanPriceJOD}
                    </span>
                  )}
                </div>
                {s.notes && <p className="text-xs text-text-secondary mt-1">{s.notes}</p>}
                {s.warnings && (
                  <p className="text-xs text-warning-text mt-1">⚠ {s.warnings}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <div className="text-xs text-text-secondary text-center">
                  ثقة {Math.round(s.confidence * 100)}%
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSearch(s.medicineName)}
                >
                  ابحث محليًا
                </Button>
              </div>
            </div>
          ))}
          <Alert variant="warning" className="mt-3">
            <span className="text-xs">
              نتائج الذكاء الاصطناعي تقديرية وقد لا تعكس الواقع بدقة. تحقق دائمًا مع الصيدلاني.
            </span>
          </Alert>
        </div>
      )}
    </div>
  );
}

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(queryParam);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<GeminiSearchResult | null>(null);

  const { isFavorite, toggle } = useFavorites();
  const comparison = useComparison();
  const recentSearches = searchHistoryService.getAll();

  const results = useMemo(
    () => medicineService.search({ query: queryParam }),
    [queryParam]
  );

  useEffect(() => {
    setQuery(queryParam);
    setAiResult(null);
  }, [queryParam]);

  const handleSearch = (q: string) => {
    if (q.trim()) {
      searchHistoryService.add(q);
      setSearchParams({ q: q.trim() });
    }
  };

  const handleAskAI = async () => {
    if (!queryParam.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await searchMedicineWithGemini(queryParam);
      setAiResult(result);
    } finally {
      setAiLoading(false);
    }
  };

  const noLocalResults = queryParam !== '' && results.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link to={ROUTES.SEARCH} className="hover:text-primary transition-colors">البحث</Link>
        <span>/</span>
        <span className="text-text-main font-medium">نتائج البحث</span>
      </nav>

      <div className="flex gap-3 mb-8">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          size="lg"
          className="flex-1"
          recentSearches={recentSearches}
          onSelectRecent={handleSearch}
        />
        <Button onClick={() => handleSearch(query)} icon={<Search size={18} />}>
          بحث
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            نتائج البحث {queryParam && `لـ "${queryParam}"`}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {results.length} نتيجة
          </p>
        </div>
        {comparison.count >= 2 && (
          <Button
            onClick={() =>
              navigate(`${ROUTES.COMPARE}?ids=${comparison.selectedIds.join(',')}`)
            }
          >
            قارن {comparison.count} أدوية
          </Button>
        )}
      </div>

      {noLocalResults ? (
        <>
          <EmptyState
            icon={<Search size={32} />}
            title="لم يتم العثور على نتائج"
            description={`لم نجد أدوية تطابق "${queryParam}" في قاعدة البيانات المحلية.`}
            action={
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate(ROUTES.SEARCH)}>
                  <ArrowRight size={16} />
                  العودة للبحث
                </Button>
                <Button
                  onClick={handleAskAI}
                  disabled={aiLoading}
                  icon={
                    aiLoading
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Sparkles size={16} />
                  }
                >
                  {aiLoading ? 'جارٍ البحث...' : 'لم أجد دوائي — حلّل بالذكاء الاصطناعي'}
                </Button>
              </div>
            }
          />
          {!isGeminiConfigured() && !aiResult && (
            <Alert variant="info" className="mt-4 max-w-xl mx-auto">
              <span className="text-sm">
                الذكاء الاصطناعي في وضع تجريبي. أضف{' '}
                <code className="bg-info-bg/50 px-1 rounded font-mono text-xs">VITE_AI_API_ENDPOINT</code>{' '}
                في .env للحصول على نتائج حقيقية.
              </span>
            </Alert>
          )}
          {aiResult && (
            <AIResults
              result={aiResult}
              onSearch={(name) => handleSearch(name)}
            />
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((med) => (
            <MedicineCard
              key={med.id}
              medicine={med}
              isFavorite={isFavorite(med.id)}
              onToggleFavorite={toggle}
              onAddToCompare={comparison.toggle}
              isInComparison={comparison.isSelected(med.id)}
              canAddToComparison={comparison.canAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
