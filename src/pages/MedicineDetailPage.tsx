import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, BarChart2, Pill, Building2,
  FlaskConical, Package, Copy, Check,
} from 'lucide-react';
import { medicineService } from '../services/medicineService';
import { useFavorites } from '../hooks/useFavorites';
import { formatPrice } from '../utils';
import { ROUTES } from '../constants';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { WarningBox } from '../components/medicine/WarningBox';
import { MedicineCard } from '../components/medicine/MedicineCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useComparison } from '../hooks/useComparison';

type TabId = 'overview' | 'alternatives' | 'warnings' | 'compare';

export function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copied, setCopied] = useState(false);
  const { isFavorite, toggle } = useFavorites();
  const comparison = useComparison();

  const medicine = id ? medicineService.getById(id) : null;
  const alternatives = id ? medicineService.getAlternatives(id) : [];

  if (!medicine) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Pill size={32} />}
          title="الدواء غير موجود"
          description="لم يتم العثور على الدواء المطلوب"
          action={
            <Button onClick={() => navigate(ROUTES.SEARCH)}>
              العودة للبحث
            </Button>
          }
        />
      </div>
    );
  }

  const fav = isFavorite(medicine.id);

  const tabs = [
    { id: 'overview' as TabId, label: 'نظرة عامة' },
    { id: 'alternatives' as TabId, label: `البدائل (${alternatives.length})` },
    { id: 'warnings' as TabId, label: `التحذيرات (${medicine.warnings.length})` },
  ];

  const copyName = async () => {
    try {
      await navigator.clipboard.writeText(medicine.tradeName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {

    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link to={ROUTES.SEARCH} className="hover:text-primary transition-colors">البحث</Link>
        <span>/</span>
        <span className="text-text-main font-medium">{medicine.tradeName}</span>
      </nav>

      <div className="bg-bg-surface border border-border-default rounded-card p-6 mb-6 shadow-card">
        <div className="flex flex-col md:flex-row gap-6">

          <div className="w-full md:w-40 h-40 bg-primary-light rounded-card flex items-center justify-center flex-shrink-0">
            <Pill size={56} className="text-primary" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-text-main">{medicine.tradeName}</h1>
                  <button
                    onClick={copyName}
                    className="p-1.5 rounded-btn text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"
                    aria-label="نسخ اسم الدواء"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                <p className="text-text-secondary text-sm">{medicine.category}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-primary">{formatPrice(medicine.price)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { icon: <FlaskConical size={15} />, label: 'المادة الفعالة', value: medicine.activeIngredient },
                { icon: <Package size={15} />, label: 'التركيز', value: medicine.concentration },
                { icon: <Pill size={15} />, label: 'الشكل الدوائي', value: medicine.dosageForm },
                { icon: <Building2 size={15} />, label: 'الشركة', value: medicine.company },
              ].map((item) => (
                <div key={item.label} className="bg-bg-page rounded-card p-3">
                  <div className="flex items-center gap-1.5 text-text-secondary text-xs mb-1">
                    {item.icon}
                    {item.label}
                  </div>
                  <p className="font-semibold text-text-main text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {medicine.requiresPrescription ? (
                <Badge variant="warning">يستلزم وصفة طبية</Badge>
              ) : (
                <Badge variant="success">بدون وصفة طبية</Badge>
              )}
              {medicine.tags.map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant={fav ? 'danger' : 'outline'}
                icon={<Heart size={16} fill={fav ? 'currentColor' : 'none'} />}
                onClick={() => toggle(medicine.id)}
              >
                {fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              </Button>
              <Button
                variant="primary"
                icon={<BarChart2 size={16} />}
                onClick={() => navigate(`${ROUTES.COMPARE}?ids=${medicine.id}`)}
              >
                قارن هذا الدواء
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border-default mb-6 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-default rounded-card p-6 shadow-card">
            <h2 className="text-lg font-bold text-text-main mb-3">وصف الدواء</h2>
            <p className="text-text-secondary leading-relaxed">{medicine.description}</p>
          </div>
          {medicine.indications.length > 0 && (
            <div className="bg-bg-surface border border-border-default rounded-card p-6 shadow-card">
              <h2 className="text-lg font-bold text-text-main mb-4">الدواعي الاستعمال</h2>
              <ul className="space-y-2">
                {medicine.indications.map((ind) => (
                  <li key={ind} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check size={15} className="text-success-text flex-shrink-0 mt-0.5" />
                    {ind}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Alert variant="warning" title="تنبيه مهم">
            المعلومات المعروضة للأغراض التعليمية فقط. استشر صيدلانيًا أو طبيبًا مختصًا قبل
            أي استخدام أو تغيير في دوائك.
          </Alert>
        </div>
      )}

      {activeTab === 'alternatives' && (
        <div>
          {alternatives.length === 0 ? (
            <EmptyState
              icon={<Pill size={28} />}
              title="لا توجد بدائل مسجّلة"
              description="لم يتم إضافة بدائل لهذا الدواء حتى الآن"
            />
          ) : (
            <>
              <Alert variant="info" className="mb-6">
                البدائل المعروضة بناءً على المادة الفعالة. تحقق دائماً مع الصيدلاني قبل الاستبدال.
              </Alert>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {alternatives.map((alt) => (
                  <MedicineCard
                    key={alt.id}
                    medicine={alt}
                    isFavorite={isFavorite(alt.id)}
                    onToggleFavorite={toggle}
                    onAddToCompare={comparison.toggle}
                    isInComparison={comparison.isSelected(alt.id)}
                    canAddToComparison={comparison.canAdd}
                  />
                ))}
              </div>
              {comparison.count >= 2 && (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={() =>
                      navigate(`${ROUTES.COMPARE}?ids=${[medicine.id, ...comparison.selectedIds].join(',')}`)
                    }
                  >
                    قارن الأدوية المحددة
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'warnings' && (
        <div>
          {medicine.warnings.length === 0 ? (
            <div className="bg-success-bg border border-success-text/25 rounded-card p-6 text-center">
              <Check size={28} className="text-success-text mx-auto mb-3" />
              <p className="font-semibold text-success-text">لا توجد تحذيرات خاصة لهذا الدواء</p>
              <p className="text-sm text-success-text/80 mt-1">
                مع ذلك، استشر صيدلانيًا قبل أي استخدام
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {medicine.warnings.map((w, i) => (
                <WarningBox key={i} warning={w} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
