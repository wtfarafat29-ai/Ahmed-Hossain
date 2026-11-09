import React, { useState } from 'react';
import { Expense } from '../types';
import { formatMoney, getTodayDate, getCurrentMonth, EXPENSE_CATEGORIES } from '../storage';
import { Plus, Trash2, Calendar, Receipt } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(getTodayDate());
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalMonthExpense = monthExpenses.reduce((acc, e) => acc + e.amt, 0);

  const handleAdd = () => {
    setErrorMsg('');
    const amtNum = Number(amount);
    if (!amtNum || amtNum <= 0) {
      setErrorMsg('খরচের পরিমাণ ০ এর বেশি দিন।');
      return;
    }
    if (!date) {
      setErrorMsg('তারিখ নির্বাচন করুন।');
      return;
    }

    const newExpense: Expense = {
      id: 'exp_' + Date.now().toString(36),
      cat: category,
      amt: amtNum,
      date,
      note: note.trim() || undefined,
    };

    onAddExpense(newExpense);
    setAmount('');
    setNote('');
  };

  return (
    <div className="space-y-4">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            দোকানের যাবতীয় খরচ ও ইউটিলিটি বিল{' '}
            <span className="text-slate-400 font-normal text-sm">(Expenses)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            বিদ্যুৎ, দোকান ভাড়া, কর্মচারী বেতন ও বিবিধ খরচ হিসাব রাখুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Add Expense Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">নতুন খরচ এন্ট্রি দিন (Add Expense)</h3>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {/* Quick Category Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              দ্রুত ক্যাটাগরি বাছুন:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    category === cat.id
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.bn}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              খরচের ধরন / নাম *
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                টাকার পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="০"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">তারিখ *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              নোট বা বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেমন: চলতি মাসের মিটার বিল"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> খরচ সংরক্ষণ করুন
          </button>
        </div>

        {/* Expenses List & Category Breakdown */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">এই মাসের খরচের হিসাব</h3>
                <span className="text-xs text-slate-400">({selectedMonth})</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">মোট খরচ: </span>
                <span className="text-lg font-bold text-rose-600">
                  {formatMoney(totalMonthExpense)}
                </span>
              </div>
            </div>

            {/* Category totals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {EXPENSE_CATEGORIES.map((cat) => {
                const catTotal = monthExpenses
                  .filter((e) => e.cat === cat.id)
                  .reduce((acc, e) => acc + e.amt, 0);

                if (catTotal === 0) return null;

                return (
                  <div
                    key={cat.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                  >
                    <div className="text-slate-500 truncate">{cat.bn}</div>
                    <div className="font-bold text-slate-800 mt-0.5">{formatMoney(catTotal)}</div>
                  </div>
                );
              })}
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {monthExpenses.map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">
                      {EXPENSE_CATEGORIES.find((c) => c.id === e.cat)?.bn || e.cat}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {e.date} {e.note ? `· ${e.note}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900">{formatMoney(e.amt)}</span>
                    <button
                      onClick={() => onDeleteExpense(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {monthExpenses.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  এই মাসে কোনো খরচের এন্ট্রি নেই।
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
