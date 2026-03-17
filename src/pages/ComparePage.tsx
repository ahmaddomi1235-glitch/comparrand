import { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart2, Plus, X, Check, Printer,
  Bookmark, Pill, Sparkles, Loader2, ChevronDown, ChevronUp,
  Camera, Upload, Image as ImageIcon, Search,
} from 'lucide-react';
import { medicineService } from '../services/medicineService';
import { comparisonService } from '../services/comparisonService';
import { searchHistoryService } from '../services/searchHistoryService';
import {
  compareMedicinesWithGemini,
  analyzeMedicineImage,
  type GeminiCompareResult,
} from '../services/GIMINI';
import { getMatchLevel, formatPrice, priceDiff, validateImageFile } from '../utils';
import type { Medicine, ImageAnalysisResult } from '../types';
import { ROUTES, IMAGE_UPLOAD } from '../constants';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/medicine/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';

interface CompareRowProps {
  label: string;
  values: string[];
  highlight?: number;
}

function CompareRow({ label, values, highlight }: CompareRowProps) {
  return (
    <tr className="border-b border-border-light">
      <td className="px-4 py-3 text-sm font-medium text-text-secondary bg-primary-light/30 whitespace-nowrap">
        {label}
      </td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`px-4 py-3 text-sm text-text-main text-center ${
            highlight === i ? 'font-bold text-success-text' : ''
          }`}
        >
          {val}
        </td>
      ))}
    </tr>
  );
}

function AIComparePanel({ result }: { result: GeminiCompareResult }) {
  const [expanded, setExpanded] = useState(true);

  const rows = [
    { label: 'ملخص المقارنة', value: result.comparisonSummary },
    { label: 'فروق المادة الفعالة', value: result.activeIngredientDifferences },
    { label: 'فروق التركيز', value: result.strengthDifferences },
    { label: 'فروق الشكل الدوائي', value: result.dosageFormDifferences },
    { label: 'مقارنة الأسعار (الأردن)', value: result.priceComparisonJordan },
    { label: 'مقارنة حجم العبوة', value: result.packageSizeComparison },
    { label: 'البدائل المقترحة', value: result.alternatives },
    { label: 'ملاحظات', value: result.notes },
  ].filter((r) => r.value);

  return (
    <div className="border border-primary/30 rounded-card bg-primary-light/20 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-primary-light/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <span className="font-semibold text-text-main">تحليل الذكاء الاصطناعي المتقدم</span>
          <span className="text-xs bg-bg-surface border border-border-light px-2 py-0.5 rounded-full text-text-secondary">
            ثقة {Math.round(result.confidence * 100)}%
          </span>
          {result.needsReview && (
            <Badge variant="warning">يحتاج مراجعة</Badge>
          )}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="bg-bg-surface rounded-card p-3">
              <p className="text-xs font-semibold text-text-secondary mb-1">{row.label}</p>
              <p className="text-sm text-text-main">{row.value}</p>
            </div>
          ))}
          {result.warnings.length > 0 && (
            <Alert variant="warning">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-sm">⚠ {w}</p>
              ))}
            </Alert>
          )}
          <Alert variant="warning">
            <span className="text-xs">
              التحليل تقديري وغير مضمون. لا تستبدل الأدوية دون استشارة صيدلاني.
            </span>
          </Alert>
        </div>
      )}
    </div>
  );
}

interface AddMedicinePanelProps {
  selectedIds: string[];
  recentSearches: string[];
  onAdd: (id: string) => void;
  onClose: () => void;
}

function AddMedicinePanel({ selectedIds, recentSearches, onAdd, onClose }: AddMedicinePanelProps) {
  const [mode, setMode] = useState<'search' | 'image'>('search');

  // --- بحث نصي ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    searchHistoryService.add(q);
    const results = medicineService.search({ query: q });
    setSearchResults(results.slice(0, 8));
  };

  // --- تحليل صورة ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<ImageAnalysisResult | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [suggestedQuery, setSuggestedQuery] = useState('');

  const handleImageFile = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error ?? 'ملف غير صالح');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setImageFile(file);
    setImageResult(null);
    setImageError(null);
  }, [previewUrl]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleImageFile(f);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    setImageLoading(true);
    setImageError(null);
    try {
      const res = await analyzeMedicineImage(imageFile);
      setImageResult(res);
      if (res.extractedMedicineName) {
        setSuggestedQuery(res.extractedMedicineName);
      }
    } catch {
      setImageError('تعذّر تحليل الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSearchFromImage = () => {
    if (!suggestedQuery.trim()) return;
    setMode('search');
    setSearchQuery(suggestedQuery);
    handleSearch(suggestedQuery);
  };

  const resetImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    setImageResult(null);
    setImageError(null);
    setSuggestedQuery('');
  };

  const handleModeSwitch = (newMode: 'search' | 'image') => {
    setMode(newMode);
  };

  return (
    <div className="bg-bg-surface border border-border-default rounded-card p-5 mb-6 shadow-card">
      {/* رأس اللوحة */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-main">إضافة دواء للمقارنة</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-btn hover:bg-bg-page transition-colors text-text-secondary"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>
      </div>

      {/* أزرار التبديل بين الوضعين */}
      <div className="flex gap-2 mb-4 p-1 bg-bg-page rounded-card">
        <button
          onClick={() => handleModeSwitch('search')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-btn text-sm font-medium transition-colors ${
            mode === 'search'
              ? 'bg-bg-surface text-primary shadow-sm border border-border-default'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <Search size={15} />
          بحث بالاسم
        </button>
        <button
          onClick={() => handleModeSwitch('image')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-btn text-sm font-medium transition-colors ${
            mode === 'image'
              ? 'bg-bg-surface text-primary shadow-sm border border-border-default'
              : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <Camera size={15} />
          تحليل صورة
        </button>
      </div>

      {/* وضع البحث النصي */}
      {mode === 'search' && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="ابحث عن دواء لإضافته..."
            recentSearches={recentSearches}
            onSelectRecent={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="mt-3 border border-border-default rounded-card overflow-hidden">
              {searchResults.map((med) => (
                <button
                  key={med.id}
                  onClick={() => onAdd(med.id)}
                  disabled={selectedIds.includes(med.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-start hover:bg-bg-page transition-colors border-b border-border-light last:border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="text-sm font-medium text-text-main">{med.tradeName}</p>
                    <p className="text-xs text-text-secondary">{med.activeIngredient} · {med.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{formatPrice(med.price)}</span>
                    {selectedIds.includes(med.id) ? (
                      <Badge variant="success">مضاف</Badge>
                    ) : (
                      <Plus size={16} className="text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* وضع تحليل الصورة */}
      {mode === 'image' && (
        <div className="space-y-3">
          {!previewUrl ? (
            <div
              className="border-2 border-dashed border-secondary rounded-card p-8 text-center cursor-pointer hover:border-primary hover:bg-primary-light/10 transition-all"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              aria-label="اختر صورة دواء"
            >
              <Upload size={32} className="text-secondary mx-auto mb-3" />
              <p className="text-sm font-semibold text-text-main mb-1">
                ارفع صورة عبوة الدواء
              </p>
              <p className="text-xs text-text-secondary mb-2">
                اضغط لاختيار صورة من جهازك
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {IMAGE_UPLOAD.ALLOWED_EXTENSIONS.map((ext) => (
                  <span key={ext} className="px-2 py-0.5 bg-border-light text-text-secondary text-xs rounded-full">
                    {ext}
                  </span>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(',')}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-bg-page border border-border-default rounded-card p-3">
              <div className="relative mb-3">
                <img
                  src={previewUrl}
                  alt="معاينة صورة الدواء"
                  className="w-full max-h-40 object-contain rounded-card bg-bg-surface"
                />
                <button
                  onClick={resetImage}
                  className="absolute top-2 end-2 w-6 h-6 rounded-full bg-white border border-border-default flex items-center justify-center hover:bg-danger-bg hover:text-danger-text transition-colors shadow text-text-secondary"
                  aria-label="إزالة الصورة"
                >
                  <X size={12} />
                </button>
              </div>
              {imageFile && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-2">
                  <ImageIcon size={12} />
                  <span className="flex-1 truncate">{imageFile.name}</span>
                  <span>{(imageFile.size / 1024).toFixed(0)} KB</span>
                </div>
              )}
              {!imageLoading && !imageResult && (
                <Button onClick={handleAnalyzeImage} className="w-full" size="sm" icon={<Sparkles size={14} />}>
                  حلّل بالذكاء الاصطناعي
                </Button>
              )}
              {imageLoading && (
                <div className="flex items-center justify-center gap-2 py-3">
                  <Loader2 size={20} className="text-primary animate-spin" />
                  <span className="text-sm text-text-secondary">جارٍ تحليل الصورة...</span>
                </div>
              )}
            </div>
          )}

          {imageError && (
            <Alert variant="danger" onClose={resetImage}>
              <span className="text-sm">{imageError}</span>
            </Alert>
          )}

          {imageResult && (
            <div className="bg-primary-light/20 border border-primary/20 rounded-card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-success-bg flex items-center justify-center shrink-0">
                  <Check size={11} className="text-success-text" />
                </div>
                <p className="text-sm font-bold text-text-main">نتائج تحليل الصورة</p>
                <span className="mr-auto text-xs text-text-secondary bg-bg-surface border border-border-light px-2 py-0.5 rounded-full">
                  ثقة {Math.round((imageResult.confidence || 0) * 100)}%
                </span>
              </div>

              {[
                { label: 'اسم الدواء', value: imageResult.extractedMedicineName },
                { label: 'المادة الفعالة', value: imageResult.extractedActiveIngredient },
                { label: 'التركيز', value: imageResult.extractedConcentration },
              ].map((item) => item.value ? (
                <div key={item.label} className="flex items-center justify-between gap-2 bg-bg-surface rounded-card px-3 py-2">
                  <span className="text-xs text-text-secondary">{item.label}</span>
                  <span className="text-xs font-bold text-text-main">{item.value}</span>
                </div>
              ) : null)}

              {imageResult.notes && (
                <p className="text-xs text-text-secondary leading-relaxed">{imageResult.notes}</p>
              )}

              {imageResult.extractedMedicineName ? (
                <div className="pt-1">
                  <p className="text-xs text-text-secondary mb-2">
                    ابحث في قاعدة البيانات المحلية عن الدواء المستخرج:
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    icon={<Search size={14} />}
                    onClick={handleSearchFromImage}
                  >
                    ابحث عن &quot;{imageResult.extractedMedicineName}&quot;
                  </Button>
                </div>
              ) : (
                <Alert variant="warning">
                  <span className="text-xs">
                    الصورة غير واضحة أو لم يتمكن النظام من استخراج اسم الدواء منها. جرب صورة أوضح.
                  </span>
                </Alert>
              )}

              <button
                onClick={resetImage}
                className="text-xs text-primary hover:text-primary-hover underline transition-colors"
              >
                ارفع صورة أخرى
              </button>
            </div>
          )}

          {!previewUrl && !imageResult && (
            <p className="text-xs text-text-secondary text-center">
              ارفع صورة واضحة لعبوة الدواء للحصول على أفضل النتائج
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids');

  const initialIds = useMemo(() => {
    if (!idsParam) return [];
    return idsParam
      .split(',')
      .slice(0, 4)
      .filter((id) => typeof id === 'string' && id.trim() !== '');
  }, [idsParam]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<GeminiCompareResult | null>(null);
  const recentSearches = searchHistoryService.getAll();

  const medicines = useMemo(
    () => medicineService.getByIds(selectedIds),
    [selectedIds]
  );

  const comparisonResult = useMemo(
    () => (medicines.length >= 2 ? comparisonService.compare(medicines) : null),
    [medicines]
  );

  const addMedicine = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= 4) return;
    const newIds = [...selectedIds, id];
    setSelectedIds(newIds);
    navigate(`${ROUTES.COMPARE}?ids=${newIds.join(',')}`, { replace: true });
    setShowAddPanel(false);
  };

  const removeMedicine = (id: string) => {
    const newIds = selectedIds.filter((i) => i !== id);
    setSelectedIds(newIds);
    navigate(`${ROUTES.COMPARE}${newIds.length > 0 ? `?ids=${newIds.join(',')}` : ''}`, { replace: true });
  };

  const saveComparison = () => {
    if (selectedIds.length >= 2) {
      comparisonService.saveComparison(selectedIds);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAICompare = async () => {
    if (medicines.length < 2) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await compareMedicinesWithGemini(
        medicines.map((m) => ({
          name: m.tradeName,
          genericName: m.activeIngredient,
          strength: m.concentration,
          dosageForm: m.dosageForm,
          company: m.company,
          priceJOD: m.price,
        }))
      );
      setAiResult(result);
    } finally {
      setAiLoading(false);
    }
  };

  const printPage = () => window.print();

  const cheapestIndex = medicines.findIndex(
    (m) => m.id === comparisonResult?.cheapestId
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-main mb-2 flex items-center gap-3">
          <BarChart2 className="text-primary" />
          مقارنة الأدوية
        </h1>
        <p className="text-text-secondary">اختر حتى 4 أدوية لمقارنتها جنبًا إلى جنب</p>
      </div>

      {/* بطاقات الأدوية المحددة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => {
          const med = medicines[i];
          return (
            <div
              key={i}
              className={`border-2 rounded-card p-3 min-h-24 flex flex-col items-center justify-center text-center transition-all ${
                med
                  ? 'border-primary bg-primary-light/30'
                  : 'border-dashed border-border-default bg-bg-surface'
              }`}
            >
              {med ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center mb-2">
                    <Pill size={18} className="text-primary" />
                  </div>
                  <p className="text-xs font-bold text-text-main line-clamp-2 mb-2">
                    {med.tradeName}
                  </p>
                  <p className="text-xs text-text-secondary mb-2">{formatPrice(med.price)}</p>
                  <button
                    onClick={() => removeMedicine(med.id)}
                    className="p-1 rounded-full hover:bg-danger-bg hover:text-danger-text text-text-secondary transition-colors"
                    aria-label="إزالة الدواء"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAddPanel(true)}
                  className="flex flex-col items-center gap-1.5 text-text-secondary hover:text-primary transition-colors w-full h-full justify-center"
                  disabled={selectedIds.length >= 4}
                >
                  <Plus size={22} />
                  <span className="text-xs">أضف دواء</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* لوحة إضافة دواء (بحث + صورة) */}
      {showAddPanel && (
        <AddMedicinePanel
          selectedIds={selectedIds}
          recentSearches={recentSearches}
          onAdd={addMedicine}
          onClose={() => setShowAddPanel(false)}
        />
      )}

      {medicines.length === 0 ? (
        <EmptyState
          icon={<BarChart2 size={36} />}
          title="أضف أدوية للمقارنة"
          description="اختر دواءين أو أكثر لعرض جدول المقارنة التفصيلي — يمكنك البحث بالاسم أو رفع صورة"
          action={
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => setShowAddPanel(true)} icon={<Search size={16} />}>
                ابحث عن دواء
              </Button>
              <Button variant="outline" onClick={() => setShowAddPanel(true)} icon={<Camera size={16} />}>
                رفع صورة دواء
              </Button>
            </div>
          }
        />
      ) : medicines.length === 1 ? (
        <Alert variant="info">
          أضف دواءً ثانيًا على الأقل لإجراء المقارنة
        </Alert>
      ) : (
        <div className="space-y-6">

          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={saveComparison}
              icon={copied ? <Check size={15} /> : <Bookmark size={15} />}
            >
              {copied ? 'تم الحفظ!' : 'حفظ المقارنة'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printPage}
              icon={<Printer size={15} />}
            >
              طباعة
            </Button>
            <Button
              size="sm"
              onClick={handleAICompare}
              disabled={aiLoading}
              icon={
                aiLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Sparkles size={15} />
              }
            >
              {aiLoading ? 'جارٍ التحليل...' : 'تحليل بالذكاء الاصطناعي'}
            </Button>
          </div>

          {comparisonResult?.warnings.map((w, i) => (
            <Alert key={i} variant="warning">
              {w}
            </Alert>
          ))}

          <div className="bg-bg-surface border border-border-default rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="px-4 py-4 text-start text-sm font-semibold text-text-secondary bg-primary-light/40 w-36">
                      المعيار
                    </th>
                    {medicines.map((med, i) => (
                      <th key={med.id} className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Pill size={18} className="text-primary" />
                          <p className="text-sm font-bold text-text-main">{med.tradeName}</p>
                          {i === cheapestIndex && (
                            <Badge variant="success">الأرخص</Badge>
                          )}
                          {med.id === comparisonResult?.bestMatchId && i !== 0 && (
                            <Badge variant="info">الأقرب تطابقاً</Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="الاسم التجاري" values={medicines.map((m) => m.tradeName)} />
                  <CompareRow label="المادة الفعالة" values={medicines.map((m) => m.activeIngredient)} />
                  <CompareRow label="التركيز" values={medicines.map((m) => m.concentration)} />
                  <CompareRow label="الشكل الدوائي" values={medicines.map((m) => m.dosageForm)} />
                  <CompareRow label="الشركة" values={medicines.map((m) => m.company)} />
                  <CompareRow
                    label="السعر"
                    values={medicines.map((m) => formatPrice(m.price))}
                    highlight={cheapestIndex >= 0 ? cheapestIndex : undefined}
                  />
                  <tr className="border-b border-border-light">
                    <td className="px-4 py-3 text-sm font-medium text-text-secondary bg-primary-light/30">
                      فرق السعر
                    </td>
                    {medicines.map((med, i) => (
                      <td key={med.id} className="px-4 py-3 text-sm text-center">
                        {i === 0 ? (
                          <span className="text-text-secondary text-xs">المرجع</span>
                        ) : (
                          <span className={med.price > medicines[0].price ? 'text-danger-text font-medium' : 'text-success-text font-medium'}>
                            {priceDiff(medicines[0].price, med.price)}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border-light">
                    <td className="px-4 py-3 text-sm font-medium text-text-secondary bg-primary-light/30">
                      درجة التطابق
                    </td>
                    {medicines.map((med, i) => {
                      if (i === 0) return (
                        <td key={med.id} className="px-4 py-3 text-center">
                          <Badge variant="info">مرجع</Badge>
                        </td>
                      );
                      const match = getMatchLevel(medicines[0], med);
                      const variant =
                        match.level === 'exact' ? 'success'
                          : match.level === 'close' ? 'info'
                          : match.level === 'partial' ? 'warning'
                          : 'danger';
                      return (
                        <td key={med.id} className="px-4 py-3 text-center">
                          <Badge variant={variant}>{match.label}</Badge>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b border-border-light">
                    <td className="px-4 py-3 text-sm font-medium text-text-secondary bg-primary-light/30">
                      يستلزم وصفة
                    </td>
                    {medicines.map((med) => (
                      <td key={med.id} className="px-4 py-3 text-center">
                        {med.requiresPrescription ? (
                          <Badge variant="warning">نعم</Badge>
                        ) : (
                          <Badge variant="success">لا</Badge>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-text-secondary bg-primary-light/30">
                      تحذيرات
                    </td>
                    {medicines.map((med) => (
                      <td key={med.id} className="px-4 py-3 text-center">
                        {med.warnings.length === 0 ? (
                          <Badge variant="success">لا تحذيرات</Badge>
                        ) : med.warnings.some((w) => w.level === 'danger') ? (
                          <Badge variant="danger">{med.warnings.length} تحذير</Badge>
                        ) : (
                          <Badge variant="warning">{med.warnings.length} ملاحظة</Badge>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-info-bg border border-info-text/25 rounded-card p-6">
            <h3 className="font-bold text-info-text text-lg mb-3">ملخص المقارنة</h3>
            <p className="text-info-text text-sm mb-3">{comparisonResult?.summary}</p>
            {comparisonResult?.cheapestId && (
              <p className="text-sm text-info-text">
                <span className="font-semibold">الأرخص:</span>{' '}
                {medicines.find((m) => m.id === comparisonResult.cheapestId)?.tradeName}
                {' '}— {formatPrice(Math.min(...medicines.map((m) => m.price)))}
              </p>
            )}
          </div>

          {aiResult && <AIComparePanel result={aiResult} />}

          <Alert variant="warning" title="قبل اتخاذ أي قرار">
            هذه المقارنة للأغراض التعليمية فقط. لا تستبدل الأدوية دون استشارة صيدلاني أو
            طبيب مختص، خاصةً الأدوية ذات التأثير الحساس على القلب، ضغط الدم، السكري،
            أو أي حالة مزمنة.
          </Alert>
        </div>
      )}
    </div>
  );
}
