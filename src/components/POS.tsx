import React, { useState } from 'react';
import { Product, Sale } from '../types';
import { formatMoney, getTodayDate, pad } from '../storage';
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';

interface POSProps {
  products: Product[];
  onCompleteSale: (sale: Sale) => void;
  lowStockThreshold: number;
}

export const POS: React.FC<POSProps> = ({ products, onCompleteSale, lowStockThreshold }) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [cart, setCart] = useState<{ id: string; q: number }[]>([]);
  const [discType, setDiscType] = useState<'flat' | 'pct'>('flat');
  const [discValue, setDiscValue] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const categories = Array.from(new Set(products.map((p) => p.cat).filter(Boolean)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cat.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCat || p.cat === selectedCat;
    return matchesSearch && matchesCat;
  });

  const getProduct = (id: string) => products.find((p) => p.id === id);

  const addToCart = (product: Product) => {
    setErrorMsg('');
    const existing = cart.find((item) => item.id === product.id);
    const currentQty = existing ? existing.q : 0;
    const nextQty = currentQty + 1;

    if (product.stock !== null && nextQty > product.stock) {
      setErrorMsg(`দুঃখিত, "${product.name}" এর পর্যাপ্ত স্টক নেই (মজুত: ${product.stock} টি)।`);
      return;
    }

    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, q: nextQty } : item)));
    } else {
      setCart([...cart, { id: product.id, q: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setErrorMsg('');
    const product = getProduct(id);
    if (!product) return;

    setCart(
      cart
        .map((item) => {
          if (item.id !== id) return item;
          const nextQty = item.q + delta;
          if (product.stock !== null && delta > 0 && nextQty > product.stock) {
            setErrorMsg(`দুঃখিত, স্টক সীমা অতিক্রম করছে (সর্বোচ্চ: ${product.stock} টি)।`);
            return item;
          }
          return { ...item, q: nextQty };
        })
        .filter((item) => item.q > 0)
    );
  };

  const setExactQty = (id: string, val: number) => {
    setErrorMsg('');
    const product = getProduct(id);
    if (!product) return;
    let target = Math.max(1, val || 1);
    if (product.stock !== null && target > product.stock) {
      target = product.stock;
      setErrorMsg(`স্টক অনুযায়ী সর্বোচ্চ ${product.stock} টি সেট করা হলো।`);
    }
    setCart(cart.map((item) => (item.id === id ? { ...item, q: target } : item)));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const prod = getProduct(item.id);
    return acc + (prod ? prod.sell * item.q : 0);
  }, 0);

  const discountAmount =
    discType === 'pct'
      ? Math.min(subtotal, (subtotal * Math.min(discValue, 100)) / 100)
      : Math.min(subtotal, discValue || 0);

  const totalPayable = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    if (cart.length === 0) {
      setErrorMsg('বিলে কমপক্ষে একটি পণ্য যোগ করুন।');
      return;
    }

    // Check all stocks
    for (const item of cart) {
      const p = getProduct(item.id);
      if (p && p.stock !== null && item.q > p.stock) {
        setErrorMsg(`"${p.name}" পণ্যের স্টক পর্যাপ্ত নয়।`);
        return;
      }
    }

    const saleItems = cart.map((item) => {
      const p = getProduct(item.id)!;
      return {
        id: p.id,
        n: p.name,
        p: p.sell,
        c: p.buy,
        q: item.q,
      };
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newSale: Sale = {
      id: 'inv_' + Date.now().toString(36),
      no: 'INV-TEMP', // Parent component will assign persistent seq number
      type: 'retail',
      date: getTodayDate(),
      time: timeStr,
      customer: customerName.trim() || 'সাধারণ ক্রেতা (Walk-in)',
      phone: customerPhone.trim(),
      disc: discountAmount,
      sub: subtotal,
      total: totalPayable,
      items: saleItems,
    };

    onCompleteSale(newSale);
    // Reset state
    setCart([]);
    setDiscValue(0);
    setCustomerName('');
    setCustomerPhone('');
    setErrorMsg('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Product Selection Column */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Filters */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্য বা ক্যাটাগরি খুঁজুন (Search product)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">সকল ক্যাটাগরি (All Categories)</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock !== null && p.stock <= 0;
            const isLowStock = p.stock !== null && p.stock <= lowStockThreshold && !isOutOfStock;

            return (
              <button
                key={p.id}
                disabled={isOutOfStock}
                onClick={() => addToCart(p)}
                className={`text-left p-2.5 bg-white rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer relative ${
                  isOutOfStock
                    ? 'opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed'
                    : isLowStock
                    ? 'border-amber-300 hover:border-amber-400 hover:shadow-md'
                    : 'border-slate-200 hover:border-emerald-500 hover:shadow-md'
                }`}
              >
                {/* Product Thumbnail */}
                <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden mb-2 relative flex items-center justify-center">
                  {p.img ? (
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-2xl">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Stock pill */}
                  {p.stock !== null && (
                    <span
                      className={`absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-bold shadow-xs ${
                        isOutOfStock
                          ? 'bg-rose-600 text-white'
                          : isLowStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-700 text-white'
                      }`}
                    >
                      {isOutOfStock ? 'স্টক শেষ' : `স্টক: ${p.stock}`}
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{p.cat || 'সাধারণ'}</div>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-800">{formatMoney(p.sell)}</span>
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              কোনো পণ্য পাওয়া যায়নি। সার্চ পরিবর্তন করুন বা নতুন পণ্য যোগ করুন।
            </div>
          )}
        </div>
      </div>

      {/* Cart & Billing Column */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-20 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">বর্তমান বিল (Current Bill)</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {cart.length} টি আইটেম
              </span>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-4">
              {cart.map((item) => {
                const prod = getProduct(item.id);
                if (!prod) return null;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs text-slate-900 truncate">{prod.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatMoney(prod.sell)} × {item.q} ={' '}
                        <span className="font-bold text-slate-800">
                          {formatMoney(prod.sell * item.q)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.q}
                        onChange={(e) => setExactQty(item.id, parseInt(e.target.value) || 1)}
                        className="w-9 h-6 text-center text-xs font-bold bg-white border border-slate-300 rounded-md"
                      />
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  বামে প্রদর্শিত পণ্যে চাপ দিয়ে বিলে যোগ করুন।
                </div>
              )}
            </div>

            {/* Discount & Customer Information */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ছাড় ধরন</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value as 'flat' | 'pct')}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="flat">টাকা (৳)</option>
                    <option value="pct">শতাংশ (%)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    ছাড় পরিমাণ {discType === 'pct' ? '(%)' : '(৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={discValue || ''}
                    onChange={(e) => setDiscValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    ক্রেতার নাম
                  </label>
                  <input
                    type="text"
                    placeholder="সাধারণ ক্রেতা"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Totals & Submit */}
          <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>সাবটোটাল (Subtotal):</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-600 font-medium">
                <span>ছাড় (Discount):</span>
                <span>- {formatMoney(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-dashed border-slate-200">
              <span>সর্বমোট দেয় (Total):</span>
              <span className="text-emerald-700 text-lg">{formatMoney(totalPayable)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setCart([]);
                  setDiscValue(0);
                  setErrorMsg('');
                }}
                disabled={cart.length === 0}
                className="px-3 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> বিল তৈরি ও রসিদ প্রিন্ট
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
