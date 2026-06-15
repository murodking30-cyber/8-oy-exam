'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCog,
  Tag,
  Package,
  Warehouse,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart2,
  ShoppingBag,
  Users,
  Receipt,
  X,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Umumiy',
    items: [{ href: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard }],
  },
  {
    label: 'Ombor',
    items: [
      { href: '/products', label: 'Mahsulotlar', icon: Package },
      { href: '/ombor', label: 'Ombor holati', icon: Warehouse },
      { href: '/kirim', label: 'Kirim', icon: ArrowDownCircle },
      { href: '/sotuv', label: 'Sotuv', icon: ArrowUpCircle },
    ],
  },
  {
    label: 'Moliya',
    items: [
      { href: '/qarzdorlar', label: 'Qarzdorlar', icon: Users },
      { href: '/taminotchilar', label: "Ta'minotchilar", icon: ShoppingBag },
      { href: '/xarajatlar', label: 'Xarajatlar', icon: Receipt },
    ],
  },
  {
    label: 'Sozlamalar',
    items: [
      { href: '/categories', label: 'Kategoriyalar', icon: Tag },
      { href: '/users', label: 'Foydalanuvchilar', icon: UserCog },
    ],
  },
  {
    label: 'Tahlil',
    items: [{ href: '/reports', label: 'Hisobotlar', icon: BarChart2 }],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex items-center gap-3 px-5 h-14 border-b border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Papash Market</p>
          <p className="text-[10px] text-slate-500">Ombor va Savdo Tizimi</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map(({ label, items }) => (
          <div key={label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map(({ href, label: itemLabel, icon: Icon }) => {
                const active =
                  pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {itemLabel}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <p className="text-[11px] text-slate-500">Papash Market</p>
        </div>
        <p className="text-[10px] text-slate-700 mt-1">v3.0.0 · Ombor va Savdo</p>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={onClose} />
      </aside>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        <SidebarContent onClose={() => {}} />
      </aside>
    </>
  );
}
