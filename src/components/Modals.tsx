import React, { useState } from 'react';
import { Sale, ShopInfo, DokanData } from '../types';
import { formatMoney } from '../storage';
import { Printer, Download, X, Check, AlertTriangle, FileArchive } from 'lucide-react';
import JSZip from 'jszip';

interface ReceiptModalProps {
  sale: Sale;
  shop: ShopInfo;
  onClose: () => void;
  onCancelSale: (id: string) => void;
  onReceiveDue?: (id: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  shop,
  onClose,
  onCancelSale,
  onReceiveDue,
}) => {
  const [format, setFormat] = useState<'th' | 'a4'>('th');
  const [isZipping, setIsZipping] = useState(false);

  const isWs = sale.type === 'ws';

  const handlePrint = () => {
    window.print();
  };

  const downloadReceiptHtml = (filename: string, content: string) => {
    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>${sale.no} Receipt</title>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Hind Siliguri', monospace, sans-serif; margin: 0; padding: 15px; color: #000; background: #fff; }
    #receipt { width: ${format === 'th' ? '300px' : '680px'}; margin: auto; font-size: ${format === 'th' ? '12px' : '14px'}; border: 1px dashed #777; padding: 12px; }
    .row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { text-align: right; padding: 4px 2px; border-bottom: 1px dashed #ccc; }
    th:first-child, td:first-child { text-align: left; }
    @media print { #receipt { border: none; } }
  </style>
</head>
<body>
  <div id="receipt">${content}</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      sale.items.forEach((item, index) => {
        const itemHtml = `
          <div style="text-align:center;">
            <h3>${shop.name}</h3>
            <p>${shop.addr} | ${shop.phone}</p>
            <hr>
            <h4>বিল নং: ${sale.no} (আইটেম ${index + 1}/${sale.items.length})</h4>
            <p>ক্রেতা: ${sale.customer || 'সাধারণ ক্রেতা'} ${sale.phone ? '· ' + sale.phone : ''}</p>
            <p>তারিখ: ${sale.date} ${sale.time || ''}</p>
            <hr>
            <div style="display:flex; justify-content:space-between; font-size:16px; margin: 10px 0;">
              <span>${item.n} (${item.q} × ${formatMoney(item.p)})</span>
              <b>${formatMoney(item.q * item.p)}</b>
            </div>
            <hr>
            <p>ধন্যবাদ, আবার আসবেন!</p>
          </div>
        `;
        zip.file(`receipt-${sale.no}-item-${index + 1}.html`, itemHtml);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipts-${sale.no}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not create ZIP file.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Controls Toolbar */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg text-sm flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> প্রিন্ট (Print)
            </button>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'th' | 'a4')}
              aria-label="রিসিট ফরম্যাট"
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700"
            >
              <option value="th">থার্মাল ৮০মিমি (Thermal 80mm)</option>
              <option value="a4">এ৪ ফরম্যাট (A4 Standard)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {isWs && (sale.due || 0) > 0 && onReceiveDue && (
              <button
                onClick={() => onReceiveDue(sale.id)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
              >
                বাকি আদায় করুন
              </button>
            )}
            <button
              onClick={() => onCancelSale(sale.id)}
              className="px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium"
            >
              বিক্রয় বাতিল
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-100">
          <div
            id="printable-receipt"
            className={`bg-white text-black p-6 shadow-md border border-slate-300 rounded-lg ${
              format === 'th' ? 'w-[320px] text-xs' : 'w-full max-w-xl text-sm'
            }`}
          >
            {/* Header */}
            <div className="text-center mb-3">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{shop.name}</h2>
              <p className="text-slate-600 text-xs mt-0.5">{shop.addr}</p>
              {shop.phone && <p className="text-slate-600 text-xs">ফোন: {shop.phone}</p>}
              <div className="border-b-2 border-dashed border-slate-800 my-2.5" />
              <div className="inline-block px-2 py-0.5 border border-slate-800 font-bold uppercase text-xs mb-1">
                {isWs ? 'পাইকারি ক্যাশ মেমো (Wholesale Memo)' : 'খুচরা বিক্রয় রসিদ (Cash Receipt)'}
              </div>
            </div>

            {/* Bill Details */}
            <div className="space-y-1 mb-2 text-xs border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between font-bold">
                <span>বিল নং: {sale.no}</span>
                <span>{sale.date} {sale.time}</span>
              </div>
              <div className="flex justify-between">
                <span>ক্রেতা: {sale.customer || 'সাধারণ ক্রেতা'}</span>
                <span>{sale.phone ? `মোবাইল: ${sale.phone}` : ''}</span>
              </div>
              {sale.addr && <div>ঠিকানা: {sale.addr}</div>}
            </div>

            {/* Items Table */}
            <table className="w-full mb-3 text-left">
              <thead>
                <tr className="border-b border-slate-400 text-xs font-semibold">
                  <th className="py-1">পণ্য</th>
                  <th className="text-center py-1">পরিমাণ</th>
                  <th className="text-right py-1">দর</th>
                  <th className="text-right py-1">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-slate-200">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1.5 font-medium">{item.n}</td>
                    <td className="text-center py-1.5">{item.q}</td>
                    <td className="text-right py-1.5">{formatMoney(item.p)}</td>
                    <td className="text-right py-1.5 font-semibold">{formatMoney(item.p * item.q)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculation summary */}
            <div className="space-y-1 border-t-2 border-slate-700 pt-2 text-xs">
              <div className="flex justify-between">
                <span>সাবটোটাল (Subtotal):</span>
                <span>{formatMoney(sale.sub)}</span>
              </div>
              {sale.disc > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>ছাড় (Discount):</span>
                  <span>- {formatMoney(sale.disc)}</span>
                </div>
              )}
              {isWs && (sale.transport || 0) > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>গাড়ি ভাড়া / ডেলিভারি:</span>
                  <span>+ {formatMoney(sale.transport)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-dashed border-slate-400 pt-1">
                <span>সর্বমোট দেয় (Grand Total):</span>
                <span>{formatMoney(isWs ? sale.grand : sale.total)}</span>
              </div>

              {isWs && (
                <>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>পরিশোধিত (Paid):</span>
                    <span>{formatMoney(sale.paid || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-700 border-t border-slate-300 pt-1">
                    <span>বাকি (Due Balance):</span>
                    <span>{formatMoney(sale.due || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Additional payment history */}
            {sale.pays && sale.pays.length > 0 && (
              <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-xs">
                <div className="font-semibold mb-1">পরবর্তী কিস্তির রেকর্ড:</div>
                {sale.pays.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>{p.date}</span>
                    <span>{formatMoney(p.amt)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-3 text-center text-xs text-slate-600 border-t border-dashed border-slate-400">
              <p className="font-medium">ধন্যবাদ! আবার আসবেন।</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Dokan Hisab Powered POS</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            রসিদটি সরাসরি প্রিন্ট অথবা HTML / ZIP আকারে সেভ করতে পারেন।
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const el = document.getElementById('printable-receipt');
                if (el) downloadReceiptHtml(`memo-${sale.no}.html`, el.innerHTML);
              }}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> HTML ডাউনলোড
            </button>
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <FileArchive className="w-3.5 h-3.5" />
              {isZipping ? 'জিপ তৈরি হচ্ছে...' : 'সব আইটেম জিপ ডাউনলোড (ZIP)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShopInfoModal: React.FC<{
  shop: ShopInfo;
  onSave: (info: ShopInfo) => void;
  onClose: () => void;
}> = ({ shop, onSave, onClose }) => {
  const [form, setForm] = useState<ShopInfo>({ ...shop });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">দোকানের তথ্য (Shop Settings)</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              দোকানের নাম (Shop Name)
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              দোকানের ঠিকানা (Address)
            </label>
            <input
              type="text"
              value={form.addr}
              onChange={(e) => setForm({ ...form, addr: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              মোবাইল / ফোন নম্বর (Phone)
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              লো-স্টক সতর্কবার্তা সীমা (Low-stock Alert Threshold)
            </label>
            <input
              type="number"
              min="1"
              value={form.low}
              onChange={(e) => setForm({ ...form, low: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <p className="text-xs text-slate-400 mt-1">
              পণ্যের স্টক এর নিচে নামলে লাল সতর্কবার্তা দেখাবে।
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
          >
            বাতিল
          </button>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
