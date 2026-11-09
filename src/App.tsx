import React, { useState, useEffect } from 'react';
import { DokanData, Sale, Product, Expense, ShopInfo, UserAccount } from './types';
import {
  loadDokanData,
  saveDokanData,
  loadAuthState,
  saveAuthState,
  formatMoney,
} from './storage';
import { Header, TabKey } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Wholesale } from './components/Wholesale';
import { Products } from './components/Products';
import { Bills } from './components/Bills';
import { Expenses } from './components/Expenses';
import { Ledger } from './components/Ledger';
import { GeminiStudio } from './components/GeminiStudio';
import { ReceiptModal, ShopInfoModal } from './components/Modals';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [authState, setAuthState] = useState(loadAuthState());
  const currentUser = authState.session
    ? authState.users.find((u) => u.id === authState.session?.uid) || null
    : null;

  const [data, setData] = useState<DokanData>(() => loadDokanData(currentUser?.id));
  const [activeTab, setActiveTab] = useState<TabKey>('dash');
  const [viewingReceipt, setViewingReceipt] = useState<Sale | null>(null);
  const [isShopInfoOpen, setIsShopInfoOpen] = useState(false);
  const [studioInitialProduct, setStudioInitialProduct] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'ok' | 'warn' | 'bad' } | null>(
    null
  );

  // Switch shop data if user changes
  useEffect(() => {
    setData(loadDokanData(currentUser?.id));
  }, [currentUser?.id]);

  // Persist store data on updates
  const updateData = (newData: DokanData) => {
    setData(newData);
    saveDokanData(newData, currentUser?.id);
  };

  const showToast = (text: string, type: 'ok' | 'warn' | 'bad' = 'ok') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Stock deduction & validation
  const lowThreshold = data.shop.low || 5;
  const lowStockCount = data.products.filter(
    (p) => p.stock !== null && p.stock <= lowThreshold
  ).length;

  const dueTotal = data.sales
    .filter((s) => s.type === 'ws')
    .reduce((acc, s) => acc + (s.due || 0), 0);

  // Complete Retail Sale
  const handleCompleteRetailSale = (sale: Sale) => {
    const saleNo = 'INV-' + String(data.seq).padStart(4, '0');
    const finalSale = { ...sale, no: saleNo };

    // Deduct inventory
    const updatedProducts = data.products.map((p) => {
      const soldItem = finalSale.items.find((i) => i.id === p.id);
      if (soldItem && p.stock !== null) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.q) };
      }
      return p;
    });

    const updatedData: DokanData = {
      ...data,
      products: updatedProducts,
      sales: [...data.sales, finalSale],
      seq: data.seq + 1,
    };

    updateData(updatedData);
    setViewingReceipt(finalSale);
    showToast(`বিল ${finalSale.no} সফলভাবে তৈরি হয়েছে!`, 'ok');
  };

  // Complete Wholesale Sale
  const handleCompleteWholesaleSale = (sale: Sale) => {
    const saleNo = 'WS-' + String(data.wseq).padStart(4, '0');
    const finalSale = { ...sale, no: saleNo };

    // Deduct inventory
    const updatedProducts = data.products.map((p) => {
      const soldItem = finalSale.items.find((i) => i.id === p.id);
      if (soldItem && p.stock !== null) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.q) };
      }
      return p;
    });

    const updatedData: DokanData = {
      ...data,
      products: updatedProducts,
      sales: [...data.sales, finalSale],
      wseq: data.wseq + 1,
    };

    updateData(updatedData);
    setViewingReceipt(finalSale);
    showToast(`পাইকারি চালান ${finalSale.no} তৈরি হয়েছে!`, 'ok');
  };

  // Cancel / Void Sale (restores inventory)
  const handleCancelSale = (saleId: string) => {
    const targetSale = data.sales.find((s) => s.id === saleId);
    if (!targetSale) return;

    if (
      !confirm(
        `আপনি কি নিশ্চিত যে বিল নং ${targetSale.no} (${formatMoney(
          targetSale.total
        )}) বাতিল করতে চান? বিক্রিত পণ্যের স্টক ইনভেন্টরিতে ফেরত চলে যাবে।`
      )
    ) {
      return;
    }

    // Restore stock
    const updatedProducts = data.products.map((p) => {
      const soldItem = targetSale.items.find((i) => i.id === p.id);
      if (soldItem && p.stock !== null) {
        return { ...p, stock: p.stock + soldItem.q };
      }
      return p;
    });

    const updatedData: DokanData = {
      ...data,
      products: updatedProducts,
      sales: data.sales.filter((s) => s.id !== saleId),
    };

    updateData(updatedData);
    setViewingReceipt(null);
    showToast(`বিল ${targetSale.no} বাতিল করা হয়েছে ও স্টক ফেরত দেওয়া হয়েছে।`, 'warn');
  };

  // Receive Due Payment
  const handleReceiveDue = (saleId: string) => {
    const targetSale = data.sales.find((s) => s.id === saleId);
    if (!targetSale || (targetSale.due || 0) <= 0) return;

    const input = prompt(
      `"${targetSale.customer || 'ব্যবসায়ী'}" এর বকেয়া পাওনা: ${formatMoney(
        targetSale.due
      )}\nকত টাকা জমা নিচ্ছেন?`,
      String(targetSale.due)
    );

    if (input === null) return;
    const amount = Math.round(parseFloat(input) * 100) / 100;
    if (isNaN(amount) || amount <= 0 || amount > (targetSale.due || 0)) {
      alert('সঠিক ও বকেয়ার সমান বা কম টাকার পরিমাণ দিন।');
      return;
    }

    const newDue = Math.max(0, Math.round(((targetSale.due || 0) - amount) * 100) / 100);
    const newPaid = Math.round(((targetSale.paid || 0) + amount) * 100) / 100;
    const today = new Date().toISOString().slice(0, 10);

    const updatedSale: Sale = {
      ...targetSale,
      paid: newPaid,
      due: newDue,
      pays: [...(targetSale.pays || []), { date: today, amt: amount }],
    };

    const updatedSales = data.sales.map((s) => (s.id === saleId ? updatedSale : s));
    updateData({ ...data, sales: updatedSales });

    if (viewingReceipt?.id === saleId) {
      setViewingReceipt(updatedSale);
    }
    showToast(`বকেয়া ${formatMoney(amount)} টাকা আদায় রেকর্ড করা হয়েছে।`, 'ok');
  };

  // Restock quick prompt
  const handleRestockProduct = (productId: string) => {
    const p = data.products.find((prod) => prod.id === productId);
    if (!p) return;

    const input = prompt(`"${p.name}" পণ্যে কত পিস নতুন স্টক যোগ করবেন?`, '10');
    if (input === null) return;
    const qty = parseFloat(input);
    if (isNaN(qty) || qty <= 0) {
      alert('সঠিক সংখ্যা লিখুন।');
      return;
    }

    const currentStock = p.stock !== null ? p.stock : 0;
    const newStock = currentStock + qty;

    const updated = data.products.map((item) =>
      item.id === productId ? { ...item, stock: newStock } : item
    );

    updateData({ ...data, products: updated });
    showToast(`"${p.name}" এর স্টক সফলভাবে ${newStock} টি করা হয়েছে।`, 'ok');
  };

  // Save / Update product
  const handleSaveProduct = (prod: Product) => {
    const exists = data.products.some((p) => p.id === prod.id);
    let updatedProducts: Product[];
    if (exists) {
      updatedProducts = data.products.map((p) => (p.id === prod.id ? prod : p));
    } else {
      updatedProducts = [prod, ...data.products];
    }
    updateData({ ...data, products: updatedProducts });
    showToast(`পণ্য "${prod.name}" সংরক্ষিত হয়েছে।`, 'ok');
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    const p = data.products.find((item) => item.id === productId);
    if (!p) return;
    if (confirm(`আপনি কি "${p.name}" মুছে ফেলতে চান? আগের বিক্রির রসিদে এর তথ্য অক্ষুণ্ণ থাকবে।`)) {
      updateData({
        ...data,
        products: data.products.filter((item) => item.id !== productId),
      });
      showToast(`পণ্যটি মুছে ফেলা হয়েছে।`, 'warn');
    }
  };

  // Add Expense
  const handleAddExpense = (expense: Expense) => {
    updateData({
      ...data,
      expenses: [expense, ...data.expenses],
    });
    showToast(`খরচ ${formatMoney(expense.amt)} টাকা যোগ করা হয়েছে।`, 'ok');
  };

  // Delete Expense
  const handleDeleteExpense = (expenseId: string) => {
    updateData({
      ...data,
      expenses: data.expenses.filter((e) => e.id !== expenseId),
    });
    showToast('খরচটি মুছে ফেলা হয়েছে।', 'warn');
  };

  // Update Product image from Gemini Studio
  const handleUpdateProductImage = (productId: string, imageUrl: string) => {
    const updated = data.products.map((p) => (p.id === productId ? { ...p, img: imageUrl } : p));
    updateData({ ...data, products: updated });
    showToast('পণ্যের প্রধান ছবি আপডেট করা হয়েছে!', 'ok');
  };

  // Launch Studio for specific product
  const handleOpenStudioForProduct = (productId: string) => {
    setStudioInitialProduct(productId);
    setActiveTab('gem');
  };

  // Auth Handling
  const handleAuthSuccess = (user: UserAccount) => {
    const updatedUsers = authState.users.some((u) => u.id === user.id)
      ? authState.users
      : [...authState.users, user];

    const newAuthState = {
      users: updatedUsers,
      session: {
        uid: user.id,
        at: Date.now(),
        exp: Date.now() + 30 * 864e5,
      },
    };

    setAuthState(newAuthState);
    saveAuthState(newAuthState);

    // If user provided a shop name on signup
    if (user.shop) {
      const uData = loadDokanData(user.id);
      uData.shop.name = user.shop;
      saveDokanData(uData, user.id);
      setData(uData);
    }

    showToast(`স্বাগতম, ${user.name}!`, 'ok');
  };

  const handleLogout = () => {
    if (confirm('আপনি কি একাউন্ট থেকে লগআউট করতে চান?')) {
      const newAuthState = { ...authState, session: null };
      setAuthState(newAuthState);
      saveAuthState(newAuthState);
      showToast('লগআউট সম্পন্ন হয়েছে।', 'ok');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-[#14202b] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-20 lg:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <div
            className={`pointer-events-auto max-w-md px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border flex items-center gap-2 animate-in slide-in-from-top-3 ${
              toastMessage.type === 'bad'
                ? 'bg-rose-600 text-white border-rose-700'
                : toastMessage.type === 'warn'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-emerald-800 text-white border-emerald-900'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        shop={data.shop}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenShopInfo={() => setIsShopInfoOpen(true)}
        user={currentUser}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
        dueTotal={dueTotal}
      />

      {/* Main Body Content based on active tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5">
        {activeTab === 'dash' && (
          <Dashboard
            data={data}
            onNavigateTab={setActiveTab}
            onRestockProduct={handleRestockProduct}
            onViewReceipt={setViewingReceipt}
          />
        )}

        {activeTab === 'pos' && (
          <POS
            products={data.products}
            onCompleteSale={handleCompleteRetailSale}
            lowStockThreshold={lowThreshold}
          />
        )}

        {activeTab === 'ws' && (
          <Wholesale
            products={data.products}
            onCompleteWholesale={handleCompleteWholesaleSale}
            lowStockThreshold={lowThreshold}
          />
        )}

        {activeTab === 'prod' && (
          <Products
            products={data.products}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onRestock={handleRestockProduct}
            onOpenStudio={handleOpenStudioForProduct}
            lowStockThreshold={lowThreshold}
          />
        )}

        {activeTab === 'bills' && (
          <Bills
            sales={data.sales}
            onViewReceipt={setViewingReceipt}
            onReceiveDue={handleReceiveDue}
            onCancelSale={handleCancelSale}
          />
        )}

        {activeTab === 'exp' && (
          <Expenses
            expenses={data.expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'led' && <Ledger data={data} />}

        {activeTab === 'gem' && (
          <GeminiStudio
            products={data.products}
            initialProductId={studioInitialProduct}
            onUpdateProductImage={handleUpdateProductImage}
          />
        )}
      </main>

      {/* Printable Receipt Modal */}
      {viewingReceipt && (
        <ReceiptModal
          sale={viewingReceipt}
          shop={data.shop}
          onClose={() => setViewingReceipt(null)}
          onCancelSale={handleCancelSale}
          onReceiveDue={handleReceiveDue}
        />
      )}

      {/* Shop Info Settings Modal */}
      {isShopInfoOpen && (
        <ShopInfoModal
          shop={data.shop}
          onSave={(info) => {
            updateData({ ...data, shop: info });
            showToast('দোকানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।', 'ok');
          }}
          onClose={() => setIsShopInfoOpen(false)}
        />
      )}
    </div>
  );
}
