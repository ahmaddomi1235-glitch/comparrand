import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal, RotateCcw, Search,
  Sparkles, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { SearchFilters } from '../types';
import { ROUTES, DOSAGE_FORMS, MEDICINE_CATEGORIES } from '../constants';
import { medicineService } from '../services/medicineService';
import { searchHistoryService } from '../services/searchHistoryService';
import { searchMedicineWithGemini, type GeminiSearchResult } from '../services/GIMINI';
import { useFavorites } from '../hooks/useFavorites';
import { useComparison } from '../hooks/useComparison';
import { SearchBar } from '../components/medicine/SearchBar';
import { MedicineCard } from '../components/medicine/MedicineCard';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

const defaultFilters: SearchFilters = {
  query: '',
  category: '',
  dosageForm: '',
  company: '',
  minPrice: '',
  maxPrice: '',
  requiresPrescription: '',
};

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
    <div className="border border-primary/30 rounded-card bg-primary-light/20 overflow-hidden">

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-primary-light/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={18} className="text-primary shrink-0" />
          <span className="font-semibold text-text-main truncate">
            نتائج الذكاء الاصطناعي لـ &quot;{result.query}&quot;
          </span>
          {result.interpretedMedicineName &&
            result.interpretedMedicineName !== result.query && (
              <span className="hidden sm:inline-block text-xs text-text-secondary bg-bg-surface border border-border-light px-2 py-0.5 rounded-full shrink-0">
                {result.interpretedMedicineName}
              </span>
            )}
        </div>
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-text-secondary" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-text-secondary" />
        )}
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 space-y-3">
          {result.jordanMarketHint && (
            <p className="text-xs text-text-secondary italic">
              {result.jordanMarketHint}
            </p>
          )}

          {result.suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-bg-surface border border-border-default rounded-card p-4 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-bold text-text-main">{s.medicineName}</p>
                {s.genericName && (
                  <p className="text-sm text-text-secondary">
                    المادة الفعالة:{' '}
                    <span className="font-medium">{s.genericName}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {s.strength && (
                    <span className="text-xs bg-border-light text-text-secondary px-2 py-0.5 rounded-full">
                      {s.strength}
                    </span>
                  )}
                  {s.dosageForm && (
                    <span className="text-xs bg-border-light text-text-secondary px-2 py-0.5 rounded-full">
                      {s.dosageForm}
                    </span>
                  )}
                  {s.manufacturer && (
                    <span className="text-xs bg-border-light text-text-secondary px-2 py-0.5 rounded-full">
                      {s.manufacturer}
                    </span>
                  )}
                  {s.estimatedJordanPriceJOD && (
                    <span className="text-xs bg-primary-light text-primary font-semibold px-2 py-0.5 rounded-full">
                      {s.estimatedJordanPriceJOD}
                    </span>
                  )}
                </div>
                {s.notes && (
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {s.notes}
                  </p>
                )}
                {s.warnings && (
                  <p className="text-xs text-warning-text mt-1">
                    ⚠ {s.warnings}
                  </p>
                )}
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <span className="text-xs text-text-secondary">
                  ثقة {Math.round(s.confidence * 100)}%
                </span>
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

          <Alert variant="warning" className="mt-1">
            <span className="text-xs">
              نتائج الذكاء الاصطناعي تقديرية وقد لا تعكس الواقع بدقة. تحقق دائمًا مع
              الصيدلاني.
            </span>
          </Alert>
        </div>
      )}
    </div>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<GeminiSearchResult | null>(null);
  const [aiEmptyWarning, setAiEmptyWarning] = useState(false);

  const { isFavorite, toggle } = useFavorites();
  const comparison = useComparison();
  const recentSearches = searchHistoryService.getAll();
  const companies = medicineService.getCompanies();

  const results = useMemo(() => {
    if (
      !searched &&
      !filters.query &&
      !filters.category &&
      !filters.dosageForm &&
      !filters.company
    )
      return [];
    return medicineService.search(filters);
  }, [filters, searched]);

  const handleSearch = (q: string) => {
    if (q.trim()) searchHistoryService.add(q);
    setFilters((prev) => ({ ...prev, query: q }));
    setSearched(true);
    setAiResult(null);
    setAiEmptyWarning(false);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearched(false);
    setAiResult(null);
    setAiEmptyWarning(false);
  };

  const handleAskAI = async () => {
    const q = filters.query.trim();

    if (!q) {
      setAiEmptyWarning(true);
      return;
    }

    setAiEmptyWarning(false);
    setAiLoading(true);
    setAiResult(null);

    const contextParts: string[] = [q];
    if (filters.category) contextParts.push(`تصنيف: ${filters.category}`);
    if (filters.dosageForm) contextParts.push(`شكل دوائي: ${filters.dosageForm}`);
    if (filters.company) contextParts.push(`شركة: ${filters.company}`);
    if (filters.minPrice !== '' && filters.maxPrice !== '')
      contextParts.push(`سعر بين ${filters.minPrice}–${filters.maxPrice} دينار`);
    else if (filters.minPrice !== '')
      contextParts.push(`سعر من ${filters.minPrice} دينار`);
    else if (filters.maxPrice !== '')
      contextParts.push(`سعر حتى ${filters.maxPrice} دينار`);

    const enrichedQuery = contextParts.join('، ');

    try {
      const result = await searchMedicineWithGemini(enrichedQuery);
      setAiResult(result);
    } finally {
      setAiLoading(false);
    }
  };

  const hasActiveFilters =
    !!filters.category ||
    !!filters.dosageForm ||
    !!filters.company ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.requiresPrescription !== '';

  const showNoResults = (searched || hasActiveFilters) && results.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-main mb-1">ابحث عن دواء</h1>
        <p className="text-text-secondary text-sm">
          ابحث باسم الدواء أو المادة الفعالة أو الشركة
        </p>
      </div>

      <div className="flex gap-2 sm:gap-3 mb-3">
        <SearchBar
          value={filters.query}
          onChange={(q) => {
            setFilters((prev) => ({ ...prev, query: q }));
            if (aiEmptyWarning) setAiEmptyWarning(false);
          }}
          onSearch={handleSearch}
          size="lg"
          className="flex-1"
          recentSearches={recentSearches}
          onSelectRecent={handleSearch}
        />
        <Button
          onClick={() => handleSearch(filters.query)}
          size="lg"
          icon={<Search size={18} />}
        >
          <span className="hidden sm:inline">بحث</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowFilters(!showFilters)}
          icon={<SlidersHorizontal size={18} />}
          className={hasActiveFilters ? 'border-primary text-primary' : ''}
          aria-label="فلاتر"
        >
          <span className="hidden sm:inline">فلاتر</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          )}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 px-4 py-3 bg-gradient-to-l from-primary-light/40 to-primary-light/10 border border-primary/25 rounded-card">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-main">
              لم تجد الدواء الذي تبحث عنه؟
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              اكتب اسمه في شريط البحث واضغط الزر — سيبحث الذكاء الاصطناعي عنه في السوق الأردني
            </p>
          </div>
        </div>
        <button
          onClick={handleAskAI}
          disabled={aiLoading}
          className={`
            flex items-center justify-center gap-2 px-5 py-2.5 rounded-btn font-semibold text-sm
            transition-all duration-200 shrink-0 w-full sm:w-auto
            ${aiLoading
              ? 'bg-primary/70 text-white cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-hover active:scale-95 shadow-sm hover:shadow-md'
            }
          `}
        >
          {aiLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {aiLoading ? 'جارٍ البحث...' : 'لم أجد دوائي — ابحث بالذكاء الاصطناعي'}
        </button>
      </div>

      {aiEmptyWarning && (
        <Alert variant="info" className="mb-4" onClose={() => setAiEmptyWarning(false)}>
          <span className="text-sm">
            ✍️ من فضلك أدخل اسم الدواء أو المادة الفعالة في شريط البحث أولًا، ثم اضغط
            الزر مرة أخرى.
          </span>
        </Alert>
      )}

      {showFilters && (
        <div className="bg-bg-surface border border-border-default rounded-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-main">فلترة النتائج</h3>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-danger-text transition-colors"
            >
              <RotateCcw size={14} />
              إعادة تعيين
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="التصنيف"
              value={filters.category}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  category: e.target.value as SearchFilters['category'],
                }))
              }
              options={MEDICINE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder="جميع التصنيفات"
            />
            <Select
              label="الشكل الدوائي"
              value={filters.dosageForm}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  dosageForm: e.target.value as SearchFilters['dosageForm'],
                }))
              }
              options={DOSAGE_FORMS.map((f) => ({ value: f, label: f }))}
              placeholder="جميع الأشكال"
            />
            <Select
              label="الشركة"
              value={filters.company}
              onChange={(e) => setFilters((p) => ({ ...p, company: e.target.value }))}
              options={companies.map((c) => ({ value: c, label: c }))}
              placeholder="جميع الشركات"
            />
            <Input
              label="السعر من (دينار)"
              type="number"
              min={0}
              value={filters.minPrice}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  minPrice: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              placeholder="0"
            />
            <Input
              label="السعر إلى (دينار)"
              type="number"
              min={0}
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  maxPrice: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              placeholder="1000"
            />
            <Select
              label="نوع الوصفة"
              value={
                filters.requiresPrescription === ''
                  ? ''
                  : String(filters.requiresPrescription)
              }
              onChange={(e) => {
                const v = e.target.value;
                setFilters((p) => ({
                  ...p,
                  requiresPrescription: v === '' ? '' : v === 'true',
                }));
              }}
              options={[
                { value: 'false', label: 'بدون وصفة' },
                { value: 'true', label: 'يستلزم وصفة' },
              ]}
              placeholder="الكل"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setSearched(true)}>تطبيق الفلاتر</Button>
          </div>
        </div>
      )}

      {!searched && !hasActiveFilters ? (

        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
            <Search size={36} className="text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-text-main mb-2">
            ابحث عن دواء
          </h3>
          <p className="text-text-secondary max-w-xs mx-auto text-sm">
            أدخل اسم الدواء أو المادة الفعالة في شريط البحث أعلاه
          </p>
        </div>
      ) : showNoResults ? (

        <div className="text-center py-12 bg-bg-surface border border-border-default rounded-card">
          <div className="w-16 h-16 rounded-full bg-border-light flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-text-main mb-2">
            لم يتم العثور على نتائج
          </h3>
          <p className="text-text-secondary text-sm mb-4 max-w-sm mx-auto">
            لم نجد أدوية تطابق بحثك في قاعدة البيانات المحلية.
            <br />
            جرّب تغيير الكلمة المفتاحية أو استخدم زر الذكاء الاصطناعي أعلاه.
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw size={14} />
            إعادة تعيين البحث
          </Button>
        </div>
      ) : (

        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-text-secondary text-sm">
              <span className="font-semibold text-text-main">{results.length}</span>{' '}
              نتيجة
              {filters.query ? ` لـ "${filters.query}"` : ''}
            </p>
            {comparison.count >= 2 && (
              <Button
                size="sm"
                onClick={() =>
                  navigate(
                    `${ROUTES.COMPARE}?ids=${comparison.selectedIds.join(',')}`
                  )
                }
              >
                قارن {comparison.count} أدوية
              </Button>
            )}
          </div>
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
        </>
      )}

      {aiResult && (
        <div className="mt-8">
          <AIResults
            result={aiResult}
            onSearch={(name) =>
              navigate(`${ROUTES.SEARCH_RESULTS}?q=${encodeURIComponent(name)}`)
            }
          />
        </div>
      )}
    </div>
  );
}
