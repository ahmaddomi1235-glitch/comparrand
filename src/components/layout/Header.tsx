import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, Search } from 'lucide-react';
import { ROUTES } from '../../constants';

const navLinks = [
  { label: 'الرئيسية', path: ROUTES.HOME },
  { label: 'ابحث عن دواء', path: ROUTES.SEARCH },
  { label: 'قارن الأدوية', path: ROUTES.COMPARE },
  { label: 'البدائل', path: '/alternatives' },
  { label: 'تحليل صورة', path: ROUTES.IMAGE_ANALYSIS },
  { label: 'الأسئلة الشائعة', path: ROUTES.FAQ },
  { label: 'من نحن', path: ROUTES.ABOUT },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-bg-surface border-b border-border-default shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 font-bold text-xl text-primary flex-shrink-0"
          >
            <span className="w-8 h-8 rounded-btn bg-primary flex items-center justify-center text-white text-sm">
              ق
            </span>
            <span>قارن دواءك</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-primary-light'
                      : 'text-text-secondary hover:text-text-main hover:bg-bg-page'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              to={ROUTES.FAVORITES}
              className="p-2 rounded-btn text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"
              title="المفضلة"
            >
              <Heart size={18} />
            </Link>
            <Link
              to={ROUTES.SEARCH}
              className="p-2 rounded-btn text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"
              title="بحث"
            >
              <Search size={18} />
            </Link>
            <button
              onClick={() => navigate(ROUTES.COMPARE)}
              className="px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-btn hover:bg-primary-hover transition-colors"
            >
              جرّب المقارنة
            </button>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <Link
              to={ROUTES.FAVORITES}
              className="p-2 rounded-btn text-text-secondary hover:text-primary transition-colors"
            >
              <Heart size={18} />
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-btn text-text-secondary hover:text-text-main transition-colors"
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border-default bg-bg-surface">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-card text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-primary-light'
                      : 'text-text-secondary hover:text-text-main hover:bg-bg-page'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-border-default">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  navigate(ROUTES.COMPARE);
                }}
                className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-btn hover:bg-primary-hover transition-colors"
              >
                جرّب المقارنة
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
