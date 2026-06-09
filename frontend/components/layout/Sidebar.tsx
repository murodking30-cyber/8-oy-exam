'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Tag,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart2,
  HardHat,
  X,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Umumiy',
    items: [{ href: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard }],
  },
  {
    label: 'Operatsiyalar',
    items: [
      { href: '/customers', label: 'Mijozlar', icon: Users },
      { href: '/users', label: 'Foydalanuvchilar', icon: UserCog },
      { href: '/categories', label: 'Kategoriyalar', icon: Tag },
      { href: '/products', label: 'Mahsulotlar', icon: Package },
      { href: '/orders', label: 'Buyurtmalar', icon: ShoppingCart },
      { href: '/payments', label: "To'lovlar", icon: CreditCard },
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
          <HardHat className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Qurilish CRM</p>
          <p className="text-[10px] text-slate-500">Materiallar boshqaruvi</p>
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
          <p className="text-[11px] text-slate-500">API: localhost:3000</p>
        </div>
        <p className="text-[10px] text-slate-700 mt-1">v1.0.0 · Qurilish CRM</p>
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
