import { Link } from 'react-router-dom';
import { Home, Search, ArrowRight } from 'lucide-react';
import { ROUTES } from '../constants';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">

        <div className="relative mb-8 inline-block">
          <div className="text-8xl font-extrabold text-primary/20 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
              <Search size={32} className="text-primary" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-text-main mb-3">الصفحة غير موجودة</h1>
        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          عذرًا، يبدو أن هذه الصفحة أُخذت لزيارة الصيدلية!
          <br />
          <span className="text-base">الرابط الذي تبحث عنه غير موجود أو تم نقله.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-btn hover:bg-primary-hover transition-colors shadow"
          >
            <Home size={18} />
            العودة للرئيسية
          </Link>
          <Link
            to={ROUTES.SEARCH}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border-default text-text-secondary font-semibold rounded-btn hover:bg-bg-page hover:text-text-main transition-colors"
          >
            <Search size={18} />
            ابحث عن دواء
          </Link>
        </div>

        <div className="mt-10 text-xs text-text-secondary">
          <p>روابط مفيدة:</p>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[
              { label: 'مقارنة الأدوية', path: ROUTES.COMPARE },
              { label: 'تحليل صورة', path: ROUTES.IMAGE_ANALYSIS },
              { label: 'المفضلة', path: ROUTES.FAVORITES },
              { label: 'من نحن', path: ROUTES.ABOUT },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                <ArrowRight size={12} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
