import React, { useState } from 'react';
import { Product, Sale } from '../types';
import { formatMoney, getTodayDate } from '../storage';
import { Search, Plus, Minus, Truck, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface WholesaleProps {
  products: Product[];
  onCompleteWholesale: (sale: Sale) => void;
  lowStockThreshold: number;
}

export const Wholesale: React.FC<WholesaleProps> = ({
  products,
  onCompleteWholesale,
  lowStockThreshold,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [cart, setCart] = useState<{ id: string; q: number; p: number }[]>([]);
  const [traderName, setTraderName] = useState('');
  const [traderPhone, setTraderPhone] = useState('');
  const [traderAddress, setTraderAddress] = useState('');
  const [discType, setDiscType] = useState<'flat' | 'pct'>('flat');
  const [discValue, setDiscValue] = useState<number>(0);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [paidNow, setPaidNow] = useState<string>(''); // empty string means paid in full
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

  const getWsPrice = (p: Product) => (p.ws > 0 ? p.ws : p.sell);

  const addToCart = (product: Product) => {
    setErrorMsg('');
    const existing = cart.find((item) => item.id === product.id);
    const currentQty = existing ? existing.q : 0;
    const nextQty = currentQty + 1;

    if (product.stock !== null && nextQty > product.stock) {
      setErrorMsg(`"${product.name}" এর পর্যাপ্ত স্টক নেই (মজুত: ${product.stock} টি)।`);
      return;
    }

    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, q: nextQty } : item)));
    } else {
      setCart([...cart, { id: product.id, q: 1, p: getWsPrice(product) }]);
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

  const setCustomUnitPrice = (id: string, price: number) => {
    setCart(cart.map((item) => (item.id === id ? { ...item, p: Math.max(0, price || 0) } : item)));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.p * item.q, 0);

  const discountAmount =
    discType === 'pct'
      ? Math.min(subtotal, (subtotal * Math.min(discValue, 100)) / 100)
      : Math.min(subtotal, discValue || 0);

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const grandTotal = afterDiscount + (transportCost || 0);

  const numericPaid =
    paidNow === '' ? grandTotal : Math.min(grandTotal, Math.max(0, parseFloat(paidNow) || 0));
  const remainingDue = Math.max(0, Math.round((grandTotal - numericPaid) * 100) / 100);

  const handleCheckout = () => {
    if (cart.length === 0) {
      setErrorMsg('পাইকারি বিলে কমপক্ষে একটি পণ্য যোগ করুন।');
      return;
    }

    if (remainingDue > 0 && !traderName.trim()) {
      setErrorMsg('বকেয়া (বাকি) লেনদেনের জন্য ব্যবসায়ীর নাম লেখা বাধ্যতামূলক।');
      return;
    }

    // Verify stock
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
        p: item.p,
        c: p.buy,
        q: item.q,
      };
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newSale: Sale = {
      id: 'ws_' + Date.now().toString(36),
      no: 'WS-TEMP',
      type: 'ws',
      date: getTodayDate(),
      time: timeStr,
      customer: traderName.trim() || 'পাইকারি ক্রেতা',
      phone: traderPhone.trim(),
      addr: traderAddress.trim(),
      dt: discType,
      dv: discValue,
      disc: discountAmount,
      sub: subtotal,
      total: afterDiscount,
      transport: transportCost,
      grand: grandTotal,
      paid: numericPaid,
      due: remainingDue,
      pays: [],
      items: saleItems,
    };

    onCompleteWholesale(newSale);
    // Reset state
    setCart([]);
    setTraderName('');
    setTraderPhone('');
    setTraderAddress('');
    setDiscValue(0);
    setTransportCost(0);
    setPaidNow('');
    setErrorMsg('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Product Grid */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পাইকারি পণ্য বা ক্যাটাগরি খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">সকল ক্যাটাগরি</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock !== null && p.stock <= 0;
            const wsPrice = getWsPrice(p);

            return (
              <button
                key={p.id}
                disabled={isOutOfStock}
                onClick={() => addToCart(p)}
                className={`text-left p-2.5 bg-white rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer ${
                  isOutOfStock
                    ? 'opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed'
                    : 'border-slate-200 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden mb-2 relative flex items-center justify-center">
                  {p.img ? (
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-2xl">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {p.stock !== null && (
                    <span
                      className={`absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        isOutOfStock ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
                      }`}
                    >
                      {isOutOfStock ? 'স্টক শেষ' : `স্টক: ${p.stock}`}
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-blue-700">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    খুচরা: {formatMoney(p.sell)} {p.ws > 0 ? '' : '(পাইকারি আলাদা দর নেই)'}
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-sm text-blue-700">{formatMoney(wsPrice)}</span>
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wholesale Order Memo Column */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-20 flex flex-col justify-between min-h-[550px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-base">পাইকারি চালান / মেমো (Wholesale)</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full">
                {cart.length} টি পণ্য
              </span>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cart Items with Rate adjustment */}
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 mb-3">
              {cart.map((item) => {
                const prod = getProduct(item.id);
                if (!prod) return null;

                return (
                  <div
                    key={item.id}
                    className="p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-xs text-slate-900 truncate flex-1">
                        {prod.name}
                      </span>
                      <span className="font-bold text-xs text-slate-900">
                        {formatMoney(item.p * item.q)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">দর ৳</span>
                        <input
                          type="number"
                          step="any"
                          value={item.p}
                          onChange={(e) => setCustomUnitPrice(item.id, parseFloat(e.target.value))}
                          className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold text-center"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.q}
                          onChange={(e) => setExactQty(item.id, parseInt(e.target.value) || 1)}
                          className="w-10 h-6 text-center text-xs font-bold bg-white border border-slate-300 rounded"
                        />
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateQty(item.id, 10)}
                          className="px-1.5 h-6 rounded bg-blue-100 text-blue-800 text-[10px] font-bold"
                          title="+10 যোগ করুন"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  পণ্য সিলেক্ট করে পাইকারি মেমোতে যুক্ত করুন।
                </div>
              )}
            </div>

            {/* Buyer Details */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    ব্যবসায়ী / দোকানের নাম *
                  </label>
                  <input
                    type="text"
                    placeholder="মেসার্স রহিম ট্রেডার্স"
                    value={traderName}
                    onChange={(e) => setTraderName(e.target.value)}
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
                    value={traderPhone}
                    onChange={(e) => setTraderPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  ব্যবসার ঠিকানা
                </label>
                <input
                  type="text"
                  placeholder="বাজার রোড, ঢাকা"
                  value={traderAddress}
                  onChange={(e) => setTraderAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

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
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    ছাড় পরিমাণ
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={discValue || ''}
                    onChange={(e) => setDiscValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    গাড়ি ভাড়া
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="০"
                    value={transportCost || ''}
                    onChange={(e) => setTransportCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Due Split */}
          <div className="pt-3 border-t border-slate-200 mt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>সাবটোটাল:</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-600">
                <span>ছাড়:</span>
                <span>- {formatMoney(discountAmount)}</span>
              </div>
            )}
            {transportCost > 0 && (
              <div className="flex justify-between text-xs text-slate-700">
                <span>গাড়ি ভাড়া / ডেলিভারি:</span>
                <span>+ {formatMoney(transportCost)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-dashed border-slate-200 pt-1">
              <span>সর্বমোট চালান মূল্য:</span>
              <span className="text-blue-800">{formatMoney(grandTotal)}</span>
            </div>

            {/* Paid vs Due Input */}
            <div className="grid grid-cols-3 gap-2 pt-1 items-end">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  নগদ পরিশোধ (Paid Now)
                </label>
                <input
                  type="number"
                  placeholder="খালি রাখলে সম্পূর্ণ পরিশোধ"
                  value={paidNow}
                  onChange={(e) => setPaidNow(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setPaidNow('')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 h-8 cursor-pointer"
              >
                সম্পূর্ণ ক্যাশ
              </button>
            </div>

            <div className="flex justify-between text-xs font-bold pt-1">
              <span className="text-slate-600">অবশিষ্ট বকেয়া (Remaining Due):</span>
              <span className={remainingDue > 0 ? 'text-rose-600 text-sm' : 'text-emerald-700'}>
                {formatMoney(remainingDue)}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setCart([]);
                  setTraderName('');
                  setDiscValue(0);
                  setTransportCost(0);
                  setPaidNow('');
                  setErrorMsg('');
                }}
                className="px-3 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                রিসেট
              </button>
              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> মেমো সম্পন্ন ও প্রিন্ট
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
