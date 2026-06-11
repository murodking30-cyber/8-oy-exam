'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Sun, Moon, LogOut, Bell } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

const titles: Record<string, string> = {
  '/dashboard': 'Boshqaruv paneli',
  '/customers': 'Mijozlar',
  '/users': 'Foydalanuvchilar',
  '/categories': 'Kategoriyalar',
  '/products': 'Mahsulotlar',
  '/orders': 'Buyurtmalar',
  '/payments': "To'lovlar",
  '/reports': 'Hisobotlar',
};

interface Props {
  onMenuClick: () => void;
}

export default function TopNavbar({ onMenuClick }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggle } = useThemeStore();
  const { user, logout } = useAuthStore();

  const title =
    Object.entries(titles).find(([path]) => pathname.startsWith(path))?.[1] ?? 'Boshqaruv paneli';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'F';

  return (
    <header className="h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden text-slate-600 dark:text-slate-400"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-base font-semibold text-slate-900 dark:text-white flex-1">{title}</h1>

      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Mavzuni almashtirish"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {user && (
          <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-1"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
