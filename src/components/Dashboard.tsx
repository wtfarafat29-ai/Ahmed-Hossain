import React, { useState } from 'react';
import { DokanData, Sale, Product } from '../types';
import { formatMoney, getTodayDate, getCurrentMonth, pad } from '../storage';
import {
  TrendingUp,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  DollarSign,
  PackageCheck,
  Calendar,
  FileText,
  Printer,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';

interface DashboardProps {
  data: DokanData;
  onNavigateTab: (tab: any) => void;
  onRestockProduct: (productId: string) => void;
  onViewReceipt: (sale: Sale) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  onNavigateTab,
  onRestockProduct,
  onViewReceipt,
}) => {
  const [showDailyMemo, setShowDailyMemo] = useState(false);
  const [memoDate, setMemoDate] = useState(getTodayDate());

  const currentMonth = getCurrentMonth();
  const monthSales = data.sales.filter((s) => s.date.startsWith(currentMonth));
  const monthExpenses = data.expenses.filter((e) => e.date.startsWith(currentMonth));

  // Totals for this month
  const totalRev = monthSales.reduce((acc, s) => acc + s.total, 0);
  const totalCogs = monthSales.reduce(
    (acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.c * item.q, 0),
    0
  );
  const totalExp = monthExpenses.reduce((acc, e) => acc + e.amt, 0);
  const netProfit = totalRev - totalCogs - totalExp;

  // Today's metrics
  const todayDate = getTodayDate();
  const todaySales = data.sales.filter((s) => s.date === todayDate);
  const todayRev = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todayCogs = todaySales.reduce(
    (acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.c * item.q, 0),
    0
  );
  const todayProfit = todayRev - todayCogs;
  const todayExp = data.expenses
    .filter((e) => e.date === todayDate)
    .reduce((acc, e) => acc + e.amt, 0);

  // Stock status
  const lowThreshold = data.shop.low || 5;
  const trackedProducts = data.products.filter((p) => p.stock !== null);
  const lowStockProducts = trackedProducts.filter(
    (p) => (p.stock as number) <= lowThreshold
  );

  // Wholesale due
  const wholesaleSales = data.sales.filter((s) => s.type === 'ws');
  const totalDue = wholesaleSales.reduce((acc, s) => acc + (s.due || 0), 0);

  // 6 Months bar chart data
  const monthsData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const mStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const mLabel = d.toLocaleString('bn-BD', { month: 'short' });
    const sList = data.sales.filter((s) => s.date.startsWith(mStr));
    const eList = data.expenses.filter((e) => e.date.startsWith(mStr));

    const rev = sList.reduce((acc, s) => acc + s.total, 0);
    const cost =
      sList.reduce((acc, s) => acc + s.items.reduce((iA, it) => iA + it.c * it.q, 0), 0) +
      eList.reduce((acc, e) => acc + e.amt, 0);

    monthsData.push({ month: mStr, label: mLabel || mStr.slice(5), rev, cost });
  }

  const maxVal = Math.max(1, ...monthsData.flatMap((m) => [m.rev, m.cost]));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Day Memo button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            দোকান সার্বিক পরিস্থিতি <span className="text-slate-400 font-normal text-sm">(Dashboard)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            আজকের তারিখ: {new Date().toLocaleDateString('bn-BD', { dateStyle: 'full' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMemoDate(getTodayDate());
              setShowDailyMemo(true);
            }}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Calendar className="w-4 h-4" /> আজকের হিসাব মেমো (Daily Memo)
          </button>
        </div>
      </div>

      {/* Alert Banners: Low Stock & Wholesale Due */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lowStockProducts.length > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>স্টক সতর্কবার্তা (Low Stock Alert)</span>
              </div>
              <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
                {lowStockProducts.length} টি পণ্য
              </span>
            </div>
            <p className="text-xs text-amber-800 mb-3">
              নিম্নলিখিত পণ্যগুলোর স্টক {lowThreshold} বা তার নিচে নেমেছে। অবিলম্বে পাইকারি অর্ডার বা স্টক পূরণ করুন:
            </p>
            <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto pr-1">
              {lowStockProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-100 text-xs"
                >
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{p.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-rose-600">স্টক: {p.stock}</span>
                    <button
                      onClick={() => onRestockProduct(p.id)}
                      className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[11px] font-semibold hover:bg-emerald-800"
                    >
                      + স্টক
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigateTab('prod')}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center justify-end gap-1 mt-auto"
            >
              সব পণ্য দেখুন <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-emerald-900 font-bold text-sm">স্টক পর্যাপ্ত রয়েছে</div>
              <div className="text-xs text-emerald-700 mt-0.5">
                সবগুলো ট্র্যাকিং পণ্যের মজুত নিরাপদ মাত্রায় আছে।
              </div>
            </div>
          </div>
        )}

        {totalDue > 0 ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <DollarSign className="w-4 h-4 text-rose-600" />
                <span>পাইকারি বকেয়া পাওনা (Wholesale Dues)</span>
              </div>
              <span className="bg-rose-200 text-rose-900 text-xs px-2 py-0.5 rounded-full font-bold">
                বাকি হিসাব
              </span>
            </div>
            <div className="text-2xl font-bold text-rose-700 my-1">{formatMoney(totalDue)}</div>
            <p className="text-xs text-rose-700 mb-3">
              মার্কেটে বিভিন্ন পাইকারি পার্টির কাছে মোট বকেয়া টাকা। বিল তালিকা থেকে আদায় এন্ট্রি দিন।
            </p>
            <button
              onClick={() => onNavigateTab('bills')}
              className="text-xs font-semibold text-rose-800 hover:text-rose-900 flex items-center justify-end gap-1 mt-auto"
            >
              বকেয়া বিল তালিকা <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="text-blue-900 font-bold text-sm">কোনো বকেয়া পাওনা নেই</div>
              <div className="text-xs text-blue-700 mt-0.5">সব পাইকারি বিল সম্পূর্ণ পরিশোধিত।</div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Summary 4 Cards */}
      <div>
        <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
          <span>এই মাসের সারসংক্ষেপ</span>
          <span className="text-xs font-normal text-slate-400">({currentMonth})</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-medium text-slate-500 mb-1">মোট বিক্রয় (Total Sales)</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{formatMoney(totalRev)}</div>
            <div className="text-[11px] text-slate-400 mt-1">{monthSales.length} টি বিল সম্পাদন</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-medium text-slate-500 mb-1">পণ্যের ক্রয়মূল্য (COGS)</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-700">{formatMoney(totalCogs)}</div>
            <div className="text-[11px] text-slate-400 mt-1">বিক্রিত পণ্যের আসল দাম</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-medium text-slate-500 mb-1">মোট দোকান খরচ (Expenses)</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600">{formatMoney(totalExp)}</div>
            <div className="text-[11px] text-slate-400 mt-1">বিদ্যুৎ, ভাড়া ও বেতন</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-medium text-slate-500 mb-1">নিট লাভ (Net Profit)</div>
            <div
              className={`text-xl sm:text-2xl font-bold ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatMoney(netProfit)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">সব খরচ ও ক্রয় বাদে আসল লাভ</div>
          </div>
        </div>
      </div>

      {/* Today's breakdown */}
      <div>
        <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
          <span>আজকের পারফরম্যান্স</span>
          <span className="text-xs font-normal text-slate-400">(Today's Metrics)</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
            <div className="text-xs font-semibold text-emerald-800">আজকের বিক্রয়</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-950 mt-1">
              {formatMoney(todayRev)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-600">আজকের বিল সংখ্যা</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {todaySales.length} টি
            </div>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
            <div className="text-xs font-semibold text-emerald-800">আজকের গ্রস লাভ</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-900 mt-1">
              {formatMoney(todayProfit)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-600">আজকের খরচ</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {formatMoney(todayExp)}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Months Chart & Recent Bills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">গত ৬ মাসের বিক্রয় ও খরচের তুলনা</h4>
              <p className="text-xs text-slate-400">সবুজ: মোট বিক্রয় | লাল: ক্রয়মূল্য + খরচ</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-700" />
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-slate-200 pb-2">
            {monthsData.map((m, idx) => {
              const revHeight = Math.max(8, (m.rev / maxVal) * 100);
              const costHeight = Math.max(8, (m.cost / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <div
                      title={`বিক্রয়: ${formatMoney(m.rev)}`}
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 bg-emerald-700 hover:bg-emerald-800 rounded-t-sm transition-all"
                    />
                    <div
                      title={`খরচ: ${formatMoney(m.cost)}`}
                      style={{ height: `${costHeight}%` }}
                      className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t-sm transition-all"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-700 rounded-xs" />
              <span>বিক্রয় আয় (Revenue)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-rose-400 rounded-xs" />
              <span>ক্রয়মূল্য ও অন্যান্য খরচ (Cost)</span>
            </div>
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm">সাম্প্রতিক লেনদেনসমূহ (Recent Bills)</h4>
              <button
                onClick={() => onNavigateTab('bills')}
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
              >
                সব বিল <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {data.sales.length > 0 ? (
                data.sales
                  .slice(-5)
                  .reverse()
                  .map((sale) => (
                    <div
                      key={sale.id}
                      onClick={() => onViewReceipt(sale)}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{sale.no}</span>
                          {sale.type === 'ws' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold">
                              পাইকারি
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {sale.customer || 'সাধারণ ক্রেতা'} · {sale.date}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-slate-900">
                          {formatMoney(sale.type === 'ws' ? sale.grand : sale.total)}
                        </div>
                        {sale.type === 'ws' && (sale.due || 0) > 0 && (
                          <div className="text-[10px] text-rose-600 font-medium">
                            বাকি: {formatMoney(sale.due)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  এখনো কোনো বিক্রয় রেকর্ড করা হয়নি। পিওএস ট্যাবে গিয়ে প্রথম বিক্রয় করুন।
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">নতুন বিক্রি শুরু করতে চান?</span>
            <button
              onClick={() => onNavigateTab('pos')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
            >
              + নতুন বিল করুন
            </button>
          </div>
        </div>
      </div>

      {/* Daily Cash Memo Modal */}
      {showDailyMemo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={memoDate}
                  onChange={(e) => setMemoDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                />
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> প্রিন্ট
                </button>
              </div>
              <button
                onClick={() => setShowDailyMemo(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Cash memo preview */}
            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const daySales = data.sales.filter((s) => s.date === memoDate);
                const dRev = daySales.reduce((acc, s) => acc + s.total, 0);
                const dCogs = daySales.reduce(
                  (acc, s) => acc + s.items.reduce((iA, it) => iA + it.c * it.q, 0),
                  0
                );
                const dItemsCount = daySales.reduce(
                  (acc, s) => acc + s.items.reduce((iA, it) => iA + it.q, 0),
                  0
                );
                const dProfit = dRev - dCogs;

                // aggregated product items
                const itemMap: { [name: string]: { q: number; rev: number; profit: number } } = {};
                daySales.forEach((s) => {
                  s.items.forEach((it) => {
                    if (!itemMap[it.n]) {
                      itemMap[it.n] = { q: 0, rev: 0, profit: 0 };
                    }
                    itemMap[it.n].q += it.q;
                    itemMap[it.n].rev += it.p * it.q;
                    itemMap[it.n].profit += (it.p - it.c) * it.q;
                  });
                });

                return (
                  <div className="text-slate-900 text-sm">
                    <div className="text-center pb-3 border-b-2 border-dashed border-slate-700">
                      <h3 className="font-bold text-lg">{data.shop.name}</h3>
                      <p className="text-xs text-slate-500">{data.shop.addr}</p>
                      <div className="font-bold text-xs bg-slate-100 inline-block px-3 py-1 mt-1 rounded uppercase">
                        দৈনিক ক্যাশ মেমো (Daily Cash Memo)
                      </div>
                      <div className="text-xs text-slate-500 mt-1">তারিখ: {memoDate}</div>
                    </div>

                    <div className="my-3 space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>মোট বিল সংখ্যা (Bills)</span>
                        <span className="font-bold">{daySales.length} টি</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>বিক্রিত পণ্যের সংখ্যা (Items sold)</span>
                        <span className="font-bold">{dItemsCount} টি</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 font-semibold text-slate-800">
                        <span>মোট বিক্রয় আয় (Total Sales)</span>
                        <span>{formatMoney(dRev)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                        <span>পণ্যের ক্রয়মূল্য (COGS)</span>
                        <span>{formatMoney(dCogs)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-t border-b-2 border-slate-800 font-bold text-sm text-emerald-800">
                        <span>মোট মুনাফা (Gross Profit)</span>
                        <span>{formatMoney(dProfit)}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-bold text-xs mb-2">বিক্রিত পণ্যসমূহের তালিকা:</h4>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-300 font-semibold text-slate-600">
                            <th className="text-left py-1">পণ্য</th>
                            <th className="text-center py-1">পরিমাণ</th>
                            <th className="text-right py-1">বিক্রয়</th>
                            <th className="text-right py-1">লাভ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(itemMap).map(([name, stat], k) => (
                            <tr key={k}>
                              <td className="py-1 font-medium">{name}</td>
                              <td className="text-center py-1">{stat.q}</td>
                              <td className="text-right py-1">{formatMoney(stat.rev)}</td>
                              <td className="text-right py-1 text-emerald-700 font-semibold">
                                {formatMoney(stat.profit)}
                              </td>
                            </tr>
                          ))}
                          {Object.keys(itemMap).length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-400">
                                এই তারিখে কোনো পণ্য বিক্রি হয়নি।
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
