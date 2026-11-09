import React, { useState } from 'react';
import { Product } from '../types';
import { formatMoney } from '../storage';
import {
  Search,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  Camera,
  Image as ImageIcon,
  X,
  PackagePlus,
} from 'lucide-react';

interface ProductsProps {
  products: Product[];
  onSaveProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onRestock: (id: string) => void;
  onOpenStudio: (id: string) => void;
  lowStockThreshold: number;
}

export const Products: React.FC<ProductsProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onRestock,
  onOpenStudio,
  lowStockThreshold,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState('');
  const [formBuy, setFormBuy] = useState<number | ''>('');
  const [formSell, setFormSell] = useState<number | ''>('');
  const [formWs, setFormWs] = useState<number | ''>('');
  const [formStock, setFormStock] = useState<number | ''>('');
  const [formImg, setFormImg] = useState('');
  const [formError, setFormError] = useState('');

  const categories = Array.from(new Set(products.map((p) => p.cat).filter(Boolean)));

  const lowStockCount = products.filter(
    (p) => p.stock !== null && p.stock <= lowStockThreshold
  ).length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cat.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCat || p.cat === selectedCat;
    const matchesLow = !onlyLowStock || (p.stock !== null && p.stock <= lowStockThreshold);
    return matchesSearch && matchesCat && matchesLow;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCat('');
    setFormBuy('');
    setFormSell('');
    setFormWs('');
    setFormStock('');
    setFormImg('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCat(p.cat);
    setFormBuy(p.buy);
    setFormSell(p.sell);
    setFormWs(p.ws > 0 ? p.ws : '');
    setFormStock(p.stock !== null ? p.stock : '');
    setFormImg(p.img || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setFormImg(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      setFormError('পণ্যের নাম লিখুন।');
      return;
    }
    const buyNum = Number(formBuy) || 0;
    const sellNum = Number(formSell) || 0;
    if (sellNum <= 0) {
      setFormError('বিক্রয় মূল্য অবশ্যই ০ এর বেশি হতে হবে।');
      return;
    }

    const wsNum = formWs !== '' ? Number(formWs) || 0 : 0;
    const stockVal = formStock !== '' ? Number(formStock) || 0 : null;

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : 'p_' + Date.now().toString(36),
      name: formName.trim(),
      cat: formCat.trim() || 'সাধারণ',
      buy: buyNum,
      sell: sellNum,
      ws: wsNum,
      stock: stockVal,
      img: formImg.trim() || undefined,
    };

    onSaveProduct(newProd);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            পণ্য তালিকা ও ইনভেন্টরি <span className="text-slate-400 font-normal text-sm">(Products)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            মোট {products.length} টি পণ্য তালিকাভুক্ত রয়েছে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyLowStock
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>কম স্টক ({lowStockCount})</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> নতুন পণ্য যোগ করুন
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="নাম বা ক্যাটাগরি দিয়ে পণ্য খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="">সকল ক্যাটাগরি (All)</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => {
          const profit = p.sell - p.buy;
          const marginPct = p.buy > 0 ? (profit / p.buy) * 100 : 0;
          const isOutOfStock = p.stock !== null && p.stock <= 0;
          const isLowStock = p.stock !== null && p.stock <= lowStockThreshold && !isOutOfStock;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-3.5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                isOutOfStock
                  ? 'border-rose-300'
                  : isLowStock
                  ? 'border-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Image */}
                <div className="w-full aspect-video sm:aspect-square bg-slate-100 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center">
                  {p.img ? (
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-3xl">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Stock pill */}
                  <div className="absolute top-2 right-2">
                    {p.stock === null ? (
                      <span className="text-[10px] bg-slate-800/80 text-white px-2 py-0.5 rounded-full font-medium">
                        ট্র্যাকিং নেই
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold shadow-xs ${
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
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</h3>
                <div className="text-xs text-slate-400 mb-2">{p.cat || 'সাধারণ ক্যাটাগরি'}</div>

                <div className="space-y-1 text-xs border-t border-slate-100 pt-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ক্রয় মূল্য:</span>
                    <span className="text-slate-700 font-medium">{formatMoney(p.buy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">খুচরা বিক্রয় দর:</span>
                    <span className="font-bold text-slate-900">{formatMoney(p.sell)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">পাইকারি দর:</span>
                    <span className="font-semibold text-blue-700">
                      {p.ws > 0 ? formatMoney(p.ws) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                    <span className="text-slate-500">প্রতি পিসে লাভ:</span>
                    <span
                      className={`font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                    >
                      {formatMoney(profit)} ({marginPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(p)}
                  className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> এডিট
                </button>
                <button
                  onClick={() => onRestock(p.id)}
                  className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1"
                  title="স্টক বাড়ান"
                >
                  <PackagePlus className="w-3.5 h-3.5" /> +স্টক
                </button>
                <button
                  onClick={() => onOpenStudio(p.id)}
                  className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center justify-center gap-1"
                  title="AI ছবি স্টুডিওতে ওপেন করুন"
                >
                  <Camera className="w-3.5 h-3.5" /> স্টুডিও
                </button>
                <button
                  onClick={() => onDeleteProduct(p.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            কোনো পণ্য মেলেনি। ফিল্টার রিসেট করুন অথবা নতুন পণ্য যুক্ত করুন।
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-in fade-in">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'পণ্য সম্পাদনা (Edit Product)' : 'নতুন পণ্য যোগ করুন (Add Product)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পণ্যের নাম (Product Name) *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: তীর সয়াবিন তেল ১ লিটার"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ক্যাটাগরি (Category)
                  </label>
                  <input
                    type="text"
                    list="cat-list"
                    placeholder="যেমন: মুদি, চাল, তেল"
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <datalist id="cat-list">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    বর্তমান স্টক পরিমাণ (Stock)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="খালি রাখলে আনলিমিটেড"
                    value={formStock}
                    onChange={(e) =>
                      setFormStock(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ক্রয় মূল্য (Buy) ৳
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formBuy}
                    onChange={(e) =>
                      setFormBuy(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    খুচরা মূল্য (Sell) ৳ *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formSell}
                    onChange={(e) =>
                      setFormSell(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    পাইকারি মূল্য (WS) ৳
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="ঐচ্ছিক"
                    value={formWs}
                    onChange={(e) =>
                      setFormWs(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-blue-700 font-semibold"
                  />
                </div>
              </div>

              {/* Profit & Margin live preview */}
              {formSell !== '' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="text-slate-600">
                    খুচরা লাভ:{' '}
                    <b className="text-emerald-700">
                      {formatMoney(Number(formSell) - (Number(formBuy) || 0))} (
                      {Number(formBuy) > 0
                        ? (((Number(formSell) - Number(formBuy)) / Number(formBuy)) * 100).toFixed(
                            1
                          )
                        : 0}
                      %)
                    </b>
                  </div>
                  {formWs !== '' && (
                    <div className="text-slate-600 mt-1">
                      পাইকারি লাভ:{' '}
                      <b className="text-blue-700">
                        {formatMoney(Number(formWs) - (Number(formBuy) || 0))} (
                        {Number(formBuy) > 0
                          ? (((Number(formWs) - Number(formBuy)) / Number(formBuy)) * 100).toFixed(
                              1
                            )
                          : 0}
                        %)
                      </b>
                    </div>
                  )}
                </div>
              )}

              {/* Image Input & Preview */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  পণ্যের ছবি (Image Upload or URL)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
                  />
                  {formImg && (
                    <button
                      type="button"
                      onClick={() => setFormImg('')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      ছবি সরান
                    </button>
                  )}
                </div>

                {formImg && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={formImg} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
