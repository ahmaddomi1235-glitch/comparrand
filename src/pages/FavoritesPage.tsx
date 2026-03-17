import { useNavigate } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import { medicineService } from '../services/medicineService';
import { favoritesService } from '../services/favoritesService';
import { useFavorites } from '../hooks/useFavorites';
import { useComparison } from '../hooks/useComparison';
import { MedicineCard } from '../components/medicine/MedicineCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ROUTES } from '../constants';

export function FavoritesPage() {
  const navigate = useNavigate();
  const { favoriteIds, isFavorite, toggle } = useFavorites();
  const comparison = useComparison();

  const favorites = favoriteIds
    .map((id) => medicineService.getById(id))
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const handleClearAll = () => {
    if (window.confirm('هل تريد مسح جميع المفضلة؟')) {
      favoritesService.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
            <Heart className="text-danger-text" size={28} />
            قائمة المفضلة
          </h1>
          <p className="text-text-secondary mt-1">
            {favorites.length > 0 ? `${favorites.length} دواء محفوظ` : 'قائمتك فارغة حتى الآن'}
          </p>
        </div>
        {favorites.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            مسح الكل
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Heart size={32} />}
          title="قائمة المفضلة فارغة"
          description="أضف أدوية إلى المفضلة بالضغط على أيقونة القلب في بطاقة الدواء"
          action={
            <Button onClick={() => navigate(ROUTES.SEARCH)} icon={<Search size={16} />}>
              ابحث عن أدوية
            </Button>
          }
        />
      ) : (
        <>
          <Alert variant="info" className="mb-6">
            المفضلة محفوظة محليًا في متصفحك. سيتم مسحها إذا قمت بمسح بيانات المتصفح.
          </Alert>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((med) => (
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
              <Button
                onClick={() =>
                  navigate(`${ROUTES.COMPARE}?ids=${comparison.selectedIds.join(',')}`)
                }
              >
                قارن {comparison.count} أدوية
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
