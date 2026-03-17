import { Link } from 'react-router-dom';
import { Heart, BarChart2, ArrowLeft, Pill } from 'lucide-react';
import type { Medicine } from '../../types';
import { Badge } from '../ui/Badge';
import { formatPrice } from '../../utils';
import { ROUTES } from '../../constants';

interface MedicineCardProps {
  medicine: Medicine;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToCompare?: (id: string) => void;
  isInComparison?: boolean;
  canAddToComparison?: boolean;
  className?: string;
}

export function MedicineCard({
  medicine,
  isFavorite,
  onToggleFavorite,
  onAddToCompare,
  isInComparison = false,
  canAddToComparison = true,
  className = '',
}: MedicineCardProps) {
  const detailPath = ROUTES.MEDICINE_DETAIL.replace(':id', medicine.id);

  const highestWarningLevel = medicine.warnings.reduce<string>((acc, w) => {
    if (w.level === 'danger') return 'danger';
    if (w.level === 'warning' && acc !== 'danger') return 'warning';
    if (w.level === 'info' && acc === 'none') return 'info';
    return acc;
  }, 'none');

  const warningBadge =
    highestWarningLevel === 'danger'
      ? { label: 'تنبيه مهم', variant: 'danger' as const }
      : highestWarningLevel === 'warning'
      ? { label: 'يحتاج مراجعة', variant: 'warning' as const }
      : null;

  return (
    <div
      className={`bg-bg-surface border border-border-light rounded-card shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col ${className}`}
    >

      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-card bg-primary-light flex items-center justify-center flex-shrink-0">
              <Pill size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-text-main text-sm leading-tight truncate">
                {medicine.tradeName}
              </h3>
              <p className="text-text-secondary text-xs mt-0.5">{medicine.company}</p>
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite(medicine.id)}
            className={`p-1.5 rounded-btn flex-shrink-0 transition-colors ${
              isFavorite
                ? 'text-danger-text bg-danger-bg hover:bg-danger-text hover:text-white'
                : 'text-text-secondary hover:text-danger-text hover:bg-danger-bg'
            }`}
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
          <div>
            <p className="text-xs text-text-secondary">المادة الفعالة</p>
            <p className="text-xs font-medium text-text-main truncate" title={medicine.activeIngredient}>
              {medicine.activeIngredient}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">التركيز</p>
            <p className="text-xs font-medium text-text-main">{medicine.concentration}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">الشكل</p>
            <p className="text-xs font-medium text-text-main">{medicine.dosageForm}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">السعر</p>
            <p className="text-sm font-bold text-primary">{formatPrice(medicine.price)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {medicine.requiresPrescription && (
            <Badge variant="warning">يستلزم وصفة</Badge>
          )}
          {warningBadge && (
            <Badge variant={warningBadge.variant}>{warningBadge.label}</Badge>
          )}
          {!medicine.requiresPrescription && !warningBadge && (
            <Badge variant="success">بدون وصفة</Badge>
          )}
        </div>
      </div>

      <div className="px-5 pb-4 flex gap-2 border-t border-border-light pt-3">
        <Link
          to={detailPath}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary bg-primary-light rounded-btn hover:bg-primary hover:text-white transition-colors"
        >
          التفاصيل
          <ArrowLeft size={13} />
        </Link>
        {onAddToCompare && (
          <button
            onClick={() => onAddToCompare(medicine.id)}
            disabled={!canAddToComparison && !isInComparison}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-btn transition-colors ${
              isInComparison
                ? 'bg-primary text-white hover:bg-primary-hover'
                : canAddToComparison
                ? 'border border-border-default text-text-secondary hover:border-primary hover:text-primary bg-white'
                : 'border border-border-light text-text-secondary/40 bg-white cursor-not-allowed'
            }`}
            aria-label={isInComparison ? 'إزالة من المقارنة' : 'إضافة للمقارنة'}
          >
            <BarChart2 size={13} />
            {isInComparison ? 'في المقارنة' : 'قارن'}
          </button>
        )}
      </div>
    </div>
  );
}
