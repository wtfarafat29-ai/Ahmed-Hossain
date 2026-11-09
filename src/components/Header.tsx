import React from 'react';
import { ShopInfo, UserAccount } from '../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Search,
  Receipt,
  TrendingUp,
  Sparkles,
  Store,
  LogOut,
  User,
} from 'lucide-react';

export type TabKey = 'dash' | 'pos' | 'ws' | 'prod' | 'bills' | 'exp' | 'led' | 'gem';

interface HeaderProps {
  shop: ShopInfo;
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  onOpenShopInfo: () => void;
  user: UserAccount | null;
  onLogout: () => void;
  lowStockCount: number;
  dueTotal: number;
}

export const Header: React.FC<HeaderProps> = ({
  shop,
  activeTab,
  onSelectTab,
  onOpenShopInfo,
  user,
  onLogout,
  lowStockCount,
  dueTotal,
}) => {
  const tabs = [
    { key: 'dash' as TabKey, label: 'ড্যাশবোর্ড', sub: 'Dashboard', icon: LayoutDashboard },
    { key: 'pos' as TabKey, label: 'খুচরা বিক্রয়', sub: 'POS', icon: ShoppingCart },
    {
      key: 'ws' as TabKey,
      label: 'পাইকারি',
      sub: 'Wholesale',
      icon: Truck,
      badge: dueTotal > 0 ? 'বাকি' : undefined,
    },
    {
      key: 'prod' as TabKey,
      label: 'পণ্য তালিকা',
      sub: 'Products',
      icon: Package,
      badge: lowStockCount > 0 ? String(lowStockCount) : undefined,
    },
    { key: 'bills' as TabKey, label: 'বিল খুঁজুন', sub: 'Find bill', icon: Search },
    { key: 'exp' as TabKey, label: 'খরচ ও বিল', sub: 'Expenses', icon: Receipt },
    { key: 'led' as TabKey, label: 'আয়-ব্যয়', sub: 'Ledger', icon: TrendingUp },
    {
      key: 'gem' as TabKey,
      label: 'জেমিনি AI স্টুডিও',
      sub: 'Gemini Studio',
      icon: Sparkles,
      highlight: true,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Shop branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              🧾
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-base sm:text-lg truncate leading-tight">
                {shop.name || 'আমার দোকান হিসাব'}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {shop.phone ? `মোবাইল: ${shop.phone}` : shop.addr || 'দোকান ব্যবস্থাপনা অ্যাপ'}
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onSelectTab(t.key)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                      : t.highlight
                      ? 'text-amber-800 bg-amber-50/80 hover:bg-amber-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? 'text-emerald-700'
                        : t.highlight
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{t.label}</span>
                  {t.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        t.key === 'prod'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User & Settings actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenShopInfo}
              className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="দোকানের তথ্য সেটিং"
            >
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">দোকানের তথ্য</span>
            </button>

            {user && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                <div
                  className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0"
                  title={user.name}
                >
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left text-xs leading-tight">
                  <div className="font-semibold text-slate-800 truncate max-w-[90px]">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[90px]">
                    {user.phone || user.email}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="লগআউট"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around py-1.5 px-1 shadow-lg overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onSelectTab(t.key)}
              className={`relative flex flex-col items-center justify-center px-2 py-1 rounded-lg text-[10px] font-medium transition-colors shrink-0 ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : t.highlight
                  ? 'text-amber-700'
                  : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                {t.badge && (
                  <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] px-1 rounded-full font-bold">
                    {t.badge}
                  </span>
                )}
              </div>
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
