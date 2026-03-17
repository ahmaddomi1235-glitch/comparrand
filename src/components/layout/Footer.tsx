import { Link } from 'react-router-dom';
import { ROUTES, APP_OWNER, APP_DEVELOPER } from '../../constants';

export function Footer() {
  return (
    <footer className="bg-text-main text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-btn bg-primary flex items-center justify-center text-white font-bold">
                ق
              </span>
              <span className="text-xl font-bold">قارن دواءك</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-2 max-w-xs">
              منصة صيدلانية رقمية تساعدك على مقارنة الأدوية وفهم البدائل في السوق الأردني بشفافية وموثوقية.
            </p>
            <p className="text-gray-500 text-xs mb-4">
              الأسعار بالدينار الأردني (JOD) وقد تختلف عن أسعار الصيدليات.
            </p>
            <div className="p-3 bg-warning-bg rounded-card border border-warning-text/20">
              <p className="text-warning-text text-xs font-medium leading-relaxed">
                ⚠️ المنصة للتثقيف والمقارنة فقط. استشر صيدلي أو طبيب قبل أي قرار علاجي.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-200">روابط سريعة</h3>
            <ul className="space-y-2">
              {[
                { label: 'الرئيسية', path: ROUTES.HOME },
                { label: 'البحث عن دواء', path: ROUTES.SEARCH },
                { label: 'مقارنة الأدوية', path: ROUTES.COMPARE },
                { label: 'تحليل صورة', path: ROUTES.IMAGE_ANALYSIS },
                { label: 'المفضلة', path: ROUTES.FAVORITES },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-secondary text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-200">المعلومات القانونية</h3>
            <ul className="space-y-2">
              {[
                { label: 'من نحن', path: ROUTES.ABOUT },
                { label: 'الأسئلة الشائعة', path: ROUTES.FAQ },
                { label: 'سياسة الخصوصية', path: ROUTES.PRIVACY },
                { label: 'الشروط والتنبيهات', path: ROUTES.TERMS },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-secondary text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} قارن دواءك — جميع الحقوق محفوظة</p>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center">
            <span>Owner: <span className="text-gray-400">{APP_OWNER}</span></span>
            <span className="hidden sm:inline">·</span>
            <span>Developed by: <span className="text-gray-400">{APP_DEVELOPER}</span></span>
            <span className="hidden sm:inline">·</span>
            <span>السوق الأردني</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
