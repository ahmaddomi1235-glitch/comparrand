import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Camera,
  ArrowLeft,
  CheckCircle2,
  Banknote,
  GitCompare,
  ShieldAlert,
  Zap,
  Eye,
  Users,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ROUTES } from '../constants';
import { medicineService } from '../services/medicineService';
import { useFavorites } from '../hooks/useFavorites';
import { useComparison } from '../hooks/useComparison';
import { searchHistoryService } from '../services/searchHistoryService';
import {
  searchMedicineWithGemini,
  type GeminiSearchResult,
} from '../services/GIMINI';
import { SearchBar } from '../components/medicine/SearchBar';
import { MedicineCard } from '../components/medicine/MedicineCard';
import { Alert } from '../components/ui/Alert';

const HOW_IT_WORKS = [
  {
    step: '١',
    icon: <Search size={24} />,
    title: 'ابحث عن الدواء',
    desc: 'أدخل اسم الدواء أو المادة الفعالة في شريط البحث',
  },
  {
    step: '٢',
    icon: <Eye size={24} />,
    title: 'راجع النتائج',
    desc: 'اعرض معلومات كاملة عن الدواء والسعر والشركة',
  },
  {
    step: '٣',
    icon: <GitCompare size={24} />,
    title: 'قارن البدائل',
    desc: 'قارن بين أدوية متعددة في جدول واحد واضح',
  },
  {
    step: '٤',
    icon: <ShieldAlert size={24} />,
    title: 'اقرأ التنبيهات',
    desc: 'تحقق من التحذيرات المهمة قبل أي استبدال',
  },
];

const WHY_US = [
  {
    icon: <Banknote size={28} />,
    title: 'شفافية الأسعار',
    desc: 'قارن أسعار الأدوية الأصلية والبدائل الجنيريك بوضوح',
  },
  {
    icon: <CheckCircle2 size={28} />,
    title: 'فهم المادة الفعالة',
    desc: 'اعرف ما تأخذه فعلاً وتحقق من تطابق البدائل',
  },
  {
    icon: <GitCompare size={28} />,
    title: 'مقارنة ذكية',
    desc: 'جدول مقارنة شامل يوضح الفروق بدقة',
  },
  {
    icon: <Zap size={28} />,
    title: 'سريع وسهل',
    desc: 'واجهة مريحة تعطيك الإجابة في ثوانٍ',
  },
];

function HomeGeminiPanel({
  result,
  onSearch,
}: {
  result: GeminiSearchResult;
  onSearch: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!result.suggestions.length) return null;

  return (
    <div className="max-w-2xl mx-auto mt-4 border border-primary/30 rounded-card bg-white/80 overflow-hidden shadow-card">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-start hover:bg-primary-light/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="font-semibold text-sm text-text-main">
            اقتراحات Gemini لـ &quot;{result.query}&quot;
          </span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="px-5 pb-4 space-y-2">
          {result.suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-bg-surface border border-border-default rounded-card p-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-text-main text-sm">{s.medicineName}</p>
                <p className="text-xs text-text-secondary">
                  {s.genericName && `${s.genericName} · `}
                  {s.strength && `${s.strength} · `}
                  {s.estimatedJordanPriceJOD && <span className="text-primary font-medium">{s.estimatedJordanPriceJOD}</span>}
                </p>
                {s.notes && <p className="text-xs text-text-secondary mt-0.5">{s.notes}</p>}
              </div>
              <button
                onClick={() => onSearch(s.medicineName)}
                className="text-xs text-primary border border-primary/40 px-3 py-1.5 rounded-btn hover:bg-primary-light transition-colors whitespace-nowrap"
              >
                ابحث
              </button>
            </div>
          ))}
          <p className="text-xs text-text-secondary text-center pt-1">
            نتائج Gemini تقديرية — تحقق مع الصيدلاني
          </p>
        </div>
      )}
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResult, setGeminiResult] = useState<GeminiSearchResult | null>(null);
  const { isFavorite, toggle } = useFavorites();
  const comparison = useComparison();
  const recentSearches = searchHistoryService.getAll();
  const popularMedicines = medicineService.getPopular(6);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    searchHistoryService.add(q);
    navigate(`${ROUTES.SEARCH_RESULTS}?q=${encodeURIComponent(q.trim())}`);
  };

  const handleAskGemini = async () => {
    const q = query.trim();
    if (!q) return;
    setGeminiLoading(true);
    setGeminiResult(null);
    try {
      const result = await searchMedicineWithGemini(q);
      setGeminiResult(result);
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div>

      <section className="bg-gradient-to-b from-bg-page to-primary-light/30 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-primary-light text-primary text-sm font-semibold rounded-full mb-6">
            منصة صيدلانية رقمية
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-main leading-tight mb-5">
            قارن الأدوية بوضوح،{' '}
            <span className="text-primary">وافهم البدائل</span>{' '}
            قبل أن تقرر
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            منصتنا تساعدك على مقارنة الأسعار، فهم المواد الفعالة، واكتشاف البدائل الدوائية
            بشفافية تامة. قرارات أكثر وعياً، وليس بديلاً عن صيدليك.
          </p>

          <div className="bg-white rounded-card p-2 shadow-card-hover max-w-2xl mx-auto flex gap-2 mb-4">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSearch={handleSearch}
              size="lg"
              placeholder="ابحث عن الدواء بالاسم أو المادة الفعالة..."
              recentSearches={recentSearches}
              onSelectRecent={handleSearch}
              className="flex-1"
            />
            <button
              onClick={() => handleSearch(query)}
              className="px-6 py-3 bg-primary text-white font-bold rounded-card hover:bg-primary-hover transition-colors flex-shrink-0"
            >
              بحث
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <button
              onClick={handleAskGemini}
              disabled={geminiLoading || !query.trim()}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors font-medium disabled:opacity-50"
            >
              {geminiLoading
                ? <Loader2 size={16} className="animate-spin" />
                : <Sparkles size={16} />}
              لم أجد دوائي — اسأل Gemini
            </button>
            <span className="text-text-secondary text-sm">·</span>
            <Link
              to={ROUTES.IMAGE_ANALYSIS}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors font-medium"
            >
              <Camera size={16} />
              حلّل صورة عبوة الدواء
            </Link>
          </div>

          {geminiResult && (
            <HomeGeminiPanel
              result={geminiResult}
              onSearch={(name) => {
                navigate(`${ROUTES.SEARCH_RESULTS}?q=${encodeURIComponent(name)}`);
              }}
            />
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { icon: <Banknote size={15} />, text: 'مقارنة الأسعار' },
              { icon: <GitCompare size={15} />, text: 'عرض البدائل' },
              { icon: <ShieldAlert size={15} />, text: 'تنبيهات قبل الاستبدال' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-border-default rounded-full text-sm text-text-secondary shadow-sm"
              >
                <span className="text-primary">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-bg-page">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-main mb-3">كيف يعمل الموقع؟</h2>
            <p className="text-text-secondary">خطوات بسيطة للحصول على مقارنة واضحة</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="bg-bg-surface border border-border-default rounded-card p-6 text-center relative">
                <div className="absolute -top-4 end-6 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shadow">
                  {step.step}
                </div>
                <div className="w-14 h-14 rounded-card bg-primary-light flex items-center justify-center text-primary mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-bold text-text-main mb-2">{step.title}</h3>
                <p className="text-text-secondary text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-main mb-3">لماذا قارن دواءك؟</h2>
            <p className="text-text-secondary">نؤمن بأن المعرفة أساس القرار الصحي السليم</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((item) => (
              <div key={item.title} className="group bg-bg-surface border border-border-default rounded-card p-6 hover:border-primary hover:shadow-card-hover transition-all">
                <div className="w-14 h-14 rounded-card bg-primary-light flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-bold text-text-main mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-bg-page">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-text-main">أدوية شائعة</h2>
              <p className="text-text-secondary text-sm mt-1">اعرض التفاصيل أو أضف للمقارنة مباشرة</p>
            </div>
            <Link
              to={ROUTES.SEARCH}
              className="hidden sm:flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
            >
              عرض الكل
              <ArrowLeft size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularMedicines.map((med) => (
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
          {comparison.count >= 2 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() =>
                  navigate(`${ROUTES.COMPARE}?ids=${comparison.selectedIds.join(',')}`)
                }
                className="px-8 py-3 bg-primary text-white font-bold rounded-btn hover:bg-primary-hover transition-colors shadow-card"
              >
                قارن {comparison.count} أدوية الآن
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-10 px-4 bg-bg-page">
        <div className="max-w-3xl mx-auto">
          <Alert variant="warning" title="تنبيه مهم قبل الاستخدام">
            هذه المنصة مخصصة للتثقيف والمقارنة فقط. المعلومات المقدمة لا تُغني عن استشارة
            الصيدلاني أو الطبيب المختص. لا تستبدل الأدوية دون الرجوع إلى مختص.
          </Alert>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-l from-primary to-primary-hover text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Users size={40} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">جاهز لتبدأ المقارنة؟</h2>
          <p className="text-white/80 mb-8 text-lg">
            أكثر من 1000 دواء في السوق الأردني، مقارنات شاملة بالدينار الأردني، وتنبيهات واضحة.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(ROUTES.COMPARE)}
              className="px-8 py-3.5 bg-white text-primary font-bold rounded-btn hover:bg-gray-50 transition-colors shadow"
            >
              ابدأ المقارنة
            </button>
            <button
              onClick={() => navigate(ROUTES.IMAGE_ANALYSIS)}
              className="px-8 py-3.5 border-2 border-white/60 text-white font-bold rounded-btn hover:bg-white/10 transition-colors flex items-center gap-2 justify-center"
            >
              <Camera size={18} />
              تحليل صورة دواء
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
