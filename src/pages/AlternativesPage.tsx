import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pill, ArrowUpDown } from 'lucide-react';
import { medicineService } from '../services/medicineService';
import { getMatchLevel, formatPrice, priceDiff } from '../utils';
import { ROUTES } from '../constants';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { WarningBox } from '../components/medicine/WarningBox';

type SortBy = 'price_asc' | 'price_desc' | 'match';

export function AlternativesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortBy>('match');

  const medicine = id ? medicineService.getById(id) : null;
  const rawAlternatives = id ? medicineService.getAlternatives(id) : [];

  const alternatives = useMemo(() => {
    const scored = rawAlternatives.map((alt) => ({
      ...alt,
      matchInfo: medicine ? getMatchLevel(medicine, alt) : { level: 'different' as const, label: 'غير معروف' },
    }));
    if (sortBy === 'price_asc') return [...scored].sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') return [...scored].sort((a, b) => b.price - a.price);

    const order = { exact: 0, close: 1, partial: 2, different: 3 };
    return [...scored].sort((a, b) => order[a.matchInfo.level] - order[b.matchInfo.level]);
  }, [rawAlternatives, sortBy, medicine]);

  if (!medicine) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Pill size={32} />}
          title="الدواء غير موجود"
          action={<Button onClick={() => navigate(ROUTES.SEARCH)}>العودة للبحث</Button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link
          to={ROUTES.MEDICINE_DETAIL.replace(':id', medicine.id)}
          className="hover:text-primary transition-colors"
        >
          {medicine.tradeName}
        </Link>
        <span>/</span>
        <span className="text-text-main">البدائل</span>
      </nav>

      <h1 className="text-2xl font-bold text-text-main mb-6">بدائل {medicine.tradeName}</h1>

      <div className="bg-primary-light/40 border border-primary/30 rounded-card p-5 mb-8">
        <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">الدواء الأصلي</p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-card bg-primary-light flex items-center justify-center">
            <Pill size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-text-main">{medicine.tradeName}</h2>
            <p className="text-sm text-text-secondary">
              {medicine.activeIngredient} · {medicine.concentration} · {medicine.company}
            </p>
          </div>
          <div className="text-left">
            <p className="text-xl font-extrabold text-primary">{formatPrice(medicine.price)}</p>
          </div>
        </div>
      </div>

      {rawAlternatives.length === 0 ? (
        <EmptyState
          icon={<Pill size={28} />}
          title="لا توجد بدائل مسجّلة"
          description="لم يتم إضافة بدائل لهذا الدواء في قاعدة البيانات حتى الآن"
        />
      ) : (
        <>
          <Alert variant="warning" className="mb-6">
            البدائل المعروضة لأغراض التوعية فقط. استشر صيدلانيًا أو طبيبًا قبل أي استبدال.
          </Alert>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">
              {alternatives.length} بديل
            </p>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-text-secondary" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-sm border border-border-default rounded-input px-3 py-1.5 bg-white text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="match">الأقرب تطابقًا</option>
                <option value="price_asc">الأرخص أولاً</option>
                <option value="price_desc">الأغلى أولاً</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {alternatives.map((alt) => {
              const matchVariant =
                alt.matchInfo.level === 'exact' ? 'success'
                  : alt.matchInfo.level === 'close' ? 'info'
                  : alt.matchInfo.level === 'partial' ? 'warning'
                  : 'danger';
              const diff = priceDiff(medicine.price, alt.price);
              const cheaper = alt.price < medicine.price;

              return (
                <div
                  key={alt.id}
                  className={`bg-bg-surface border rounded-card p-5 shadow-card ${
                    alt.matchInfo.level === 'exact'
                      ? 'border-success-text/30'
                      : alt.matchInfo.level === 'different'
                      ? 'border-danger-text/20'
                      : 'border-border-default'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-12 h-12 rounded-card bg-primary-light flex items-center justify-center flex-shrink-0">
                      <Pill size={22} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-text-main">{alt.tradeName}</h3>
                        <Badge variant={matchVariant}>{alt.matchInfo.label}</Badge>
                        {alt.requiresPrescription && (
                          <Badge variant="warning">يستلزم وصفة</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-2">
                        {alt.activeIngredient} · {alt.concentration} · {alt.dosageForm} · {alt.company}
                      </p>
                      {alt.warnings.slice(0, 1).map((w, i) => (
                        <WarningBox key={i} warning={w} />
                      ))}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-primary">{formatPrice(alt.price)}</p>
                        <p className={`text-sm font-medium ${cheaper ? 'text-success-text' : 'text-danger-text'}`}>
                          {cheaper ? `توفير ${diff.replace('-', '')}` : `أغلى بـ ${diff}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`${ROUTES.COMPARE}?ids=${medicine.id},${alt.id}`)}
                      >
                        قارن الاثنين
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
