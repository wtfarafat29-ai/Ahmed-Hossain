import React, { useState } from 'react';
import { Sale } from '../types';
import { formatMoney } from '../storage';
import { Search, Printer, DollarSign, Trash2, CheckCircle2, Eye } from 'lucide-react';

interface BillsProps {
  sales: Sale[];
  onViewReceipt: (sale: Sale) => void;
  onReceiveDue: (saleId: string) => void;
  onCancelSale: (saleId: string) => void;
}

export const Bills: React.FC<BillsProps> = ({
  sales,
  onViewReceipt,
  onReceiveDue,
  onCancelSale,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'' | 'retail' | 'ws' | 'due'>('');

  const filteredSales = sales
    .filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.no.toLowerCase().includes(q) ||
        (s.customer || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        s.items.some((i) => i.n.toLowerCase().includes(q));

      const matchesFilter =
        !filterType ||
        (filterType === 'retail' && s.type !== 'ws') ||
        (filterType === 'ws' && s.type === 'ws') ||
        (filterType === 'due' && (s.due || 0) > 0);

      return matchesSearch && matchesFilter;
    })
    .slice()
    .reverse();

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          বিল ও মেমো অনুসন্ধান <span className="text-slate-400 font-normal text-sm">(Find Bill)</span>
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          বিল নং, ক্রেতার নাম, মোবাইল নম্বর অথবা পণ্যের নাম দিয়ে যেকোনো রসিদ বের করুন।
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="বিল নং (INV-0001, WS-0001), ক্রেতা বা পণ্যের নাম..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: '', label: 'সকল বিল' },
              { id: 'retail', label: 'খুচরা' },
              { id: 'ws', label: 'পাইকারি' },
              { id: 'due', label: 'বকেয়া (Due)' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterType(btn.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterType === btn.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bill List Cards */}
      <div className="space-y-3">
        {filteredSales.map((s) => {
          const isWs = s.type === 'ws';
          const totalAmount = isWs ? s.grand || s.total : s.total;
          const dueAmount = s.due || 0;

          return (
            <div
              key={s.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-sm text-slate-900">{s.no}</span>
                  {isWs ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                      পাইকারি চালান
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      খুচরা রসিদ
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {s.date} {s.time}
                  </span>
                </div>

                <div className="text-xs text-slate-700 font-medium">
                  {s.customer || 'সাধারণ ক্রেতা'} {s.phone ? `· ${s.phone}` : ''}
                </div>
                {s.addr && <div className="text-[11px] text-slate-400 truncate">ঠিকানা: {s.addr}</div>}

                {/* Items summary */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {s.items.map((it, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600"
                    >
                      {it.n} × {it.q} ({formatMoney(it.p * it.q)})
                    </span>
                  ))}
                </div>
              </div>

              {/* Amount & Actions */}
              <div className="flex sm:flex-col justify-between sm:items-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <div className="text-base font-bold text-slate-900">{formatMoney(totalAmount)}</div>
                  {isWs ? (
                    dueAmount > 0 ? (
                      <div className="text-xs font-bold text-rose-600">
                        বাকি: {formatMoney(dueAmount)}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-emerald-700">সম্পূর্ণ পরিশোধিত</div>
                    )
                  ) : (
                    <div className="text-[11px] text-slate-400">পরিশোধিত</div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onViewReceipt(s)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>রসিদ</span>
                  </button>

                  {isWs && dueAmount > 0 && (
                    <button
                      onClick={() => onReceiveDue(s.id)}
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                      title="বকেয়া আদায় রেকর্ড করুন"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>আদায়</span>
                    </button>
                  )}

                  <button
                    onClick={() => onCancelSale(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="বিক্রয় বাতিল করুন (স্টক ফেরত যাবে)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSales.length === 0 && (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
            কোনো বিল খুঁজে পাওয়া যায়নি। অনুসন্ধান ফিল্টার পরিবর্তন করুন।
          </div>
        )}
      </div>
    </div>
  );
};
