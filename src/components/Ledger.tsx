import React, { useState } from 'react';
import { DokanData } from '../types';
import { formatMoney, getCurrentMonth, EXPENSE_CATEGORIES } from '../storage';
import { TrendingUp, FileText, Printer, Calendar, ArrowUpRight } from 'lucide-react';

interface LedgerProps {
  data: DokanData;
}

export const Ledger: React.FC<LedgerProps> = ({ data }) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

  // Month calculations
  const monthSales = data.sales.filter((s) => s.date.startsWith(selectedMonth));
  const monthExpenses = data.expenses.filter((e) => e.date.startsWith(selectedMonth));

  const totalRev = monthSales.reduce((acc, s) => acc + s.total, 0);
  const totalCogs = monthSales.reduce(
    (acc, s) => acc + s.items.reduce((iA, it) => iA + it.c * it.q, 0),
    0
  );
  const grossProfit = totalRev - totalCogs;
  const totalExp = monthExpenses.reduce((acc, e) => acc + e.amt, 0);
  const netProfit = grossProfit - totalExp;

  // Expense breakdown
  const expBreakdown = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    amount: monthExpenses.filter((e) => e.cat === cat.id).reduce((acc, e) => acc + e.amt, 0),
  }));

  // Unique list of all months in data
  const allMonths = Array.from(
    new Set([...data.sales, ...data.expenses].map((x) => x.date.slice(0, 7)))
  ).sort().reverse();

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            আয়-ব্যয় ও লাভ-ক্ষতির বিবরণী{' '}
            <span className="text-slate-400 font-normal text-sm">(Income & Expense Statement)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            দোকানের আসল লাভ ও ব্যয়ের হিসাব নিখুঁতভাবে পর্যালোচনা করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
          />
          <button
            onClick={() => setShowMonthlyReport(true)}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4" /> মাসিক রিপোর্ট (Monthly Report)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* P&L Statement Card */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">
              মাসিক আর্থিক ফলাফল ({selectedMonth})
            </h3>
            <span className="text-xs text-slate-500">{monthSales.length} টি বিক্রয় অর্ডার</span>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100 font-semibold text-slate-900">
              <span>মোট বিক্রয় রাজস্ব (Revenue - Sales)</span>
              <span>{formatMoney(totalRev)}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 text-slate-600">
              <span>- বিক্রিত পণ্যের মূল ক্রয়মূল্য (Cost of Goods)</span>
              <span className="text-slate-700">{formatMoney(totalCogs)}</span>
            </div>

            <div className="flex justify-between py-2 border-b-2 border-slate-300 font-bold text-slate-900 bg-slate-50 px-2 rounded-lg">
              <span>মোট মোট লাভ (Gross Profit)</span>
              <span className={grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                {formatMoney(grossProfit)}
              </span>
            </div>

            <div className="pt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              দোকান পরিচালন ব্যয় (Operating Expenses):
            </div>

            {expBreakdown.map((item) => (
              <div
                key={item.id}
                className="flex justify-between py-1 text-xs text-slate-600 pl-3 border-b border-slate-100/70"
              >
                <span>- {item.bn} ({item.en})</span>
                <span className="font-medium">{formatMoney(item.amount)}</span>
              </div>
            ))}

            <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-700 font-semibold">
              <span>- সর্বমোট দোকান ব্যয় (Total Expenses)</span>
              <span className="text-rose-600">{formatMoney(totalExp)}</span>
            </div>

            <div className="flex justify-between py-3 border-t-2 border-b-2 border-slate-800 font-bold text-base bg-emerald-50/60 px-3 rounded-xl mt-3">
              <span className="text-slate-900">নিট আসল লাভ (NET PROFIT)</span>
              <span className={netProfit >= 0 ? 'text-emerald-700 text-lg' : 'text-rose-600 text-lg'}>
                {formatMoney(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* All Months History Table */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3">সকল মাসের সারসংক্ষেপ (History)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold text-left">
                  <th className="py-2">মাস</th>
                  <th className="py-2 text-right">বিক্রয়</th>
                  <th className="py-2 text-right">ব্যয়</th>
                  <th className="py-2 text-right">নিট লাভ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allMonths.map((m) => {
                  const sList = data.sales.filter((s) => s.date.startsWith(m));
                  const eList = data.expenses.filter((e) => e.date.startsWith(m));

                  const mRev = sList.reduce((acc, s) => acc + s.total, 0);
                  const mCost =
                    sList.reduce(
                      (acc, s) => acc + s.items.reduce((iA, it) => iA + it.c * it.q, 0),
                      0
                    ) + eList.reduce((acc, e) => acc + e.amt, 0);
                  const mNet = mRev - mCost;

                  return (
                    <tr
                      key={m}
                      onClick={() => setSelectedMonth(m)}
                      className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedMonth === m ? 'bg-emerald-50/70 font-bold' : ''
                      }`}
                    >
                      <td className="py-2.5 text-slate-900">{m}</td>
                      <td className="py-2.5 text-right font-medium">{formatMoney(mRev)}</td>
                      <td className="py-2.5 text-right text-slate-500">{formatMoney(mCost)}</td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          mNet >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {formatMoney(mNet)}
                      </td>
                    </tr>
                  );
                })}

                {allMonths.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      কোনো মাসের ডাটা পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Report Modal */}
      {showMonthlyReport && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                />
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> প্রিন্ট
                </button>
              </div>
              <button
                onClick={() => setShowMonthlyReport(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-slate-900 text-sm">
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-700 mb-4">
                <h3 className="font-bold text-lg">{data.shop.name}</h3>
                <p className="text-xs text-slate-500">{data.shop.addr}</p>
                <div className="font-bold text-xs bg-slate-100 inline-block px-3 py-1 mt-1 rounded uppercase">
                  মাসিক আয়-ব্যয় ও মুনাফা রিপোর্ট (MONTHLY REPORT)
                </div>
                <div className="text-xs text-slate-500 mt-1">হিসাবের মাস: {selectedMonth}</div>
              </div>

              <div className="space-y-1.5 text-xs mb-4">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>মোট সম্পন্ন বিল সংখ্যা:</span>
                  <span className="font-bold">{monthSales.length} টি</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>মোট বিক্রয় রাজস্ব (Revenue):</span>
                  <span className="font-bold">{formatMoney(totalRev)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>- বিক্রিত পণ্যের ক্রয়মূল্য (COGS):</span>
                  <span>{formatMoney(totalCogs)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                  <span>মোট গ্রস লাভ (Gross Profit):</span>
                  <span className="text-emerald-700">{formatMoney(grossProfit)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                  <span>- দোকান পরিচালন ও অন্যান্য খরচ (Expenses):</span>
                  <span>{formatMoney(totalExp)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-b-2 border-slate-800 font-bold text-sm bg-slate-50 px-2">
                  <span>সর্বমোট নিট লাভ (NET PROFIT):</span>
                  <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                    {formatMoney(netProfit)}
                  </span>
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="mt-4">
                <h4 className="font-bold text-xs mb-2">খরচের খাতওয়ারী বিবরণ:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {expBreakdown.map((b) => (
                    <div key={b.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-slate-500">{b.bn}</div>
                      <div className="font-bold text-slate-800 mt-0.5">{formatMoney(b.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
