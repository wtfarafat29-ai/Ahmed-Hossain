import { DokanData, Product, UserAccount } from './types';

export const KEY_PREFIX = 'dokan.hisab.v1';
export const AUTH_KEY = `${KEY_PREFIX}.auth`;

export const EXPENSE_CATEGORIES = [
  { id: 'Electricity', en: 'Electricity', bn: 'বিদ্যুৎ বিল' },
  { id: 'Internet', en: 'Internet', bn: 'ইন্টারনেট বিল' },
  { id: 'Rent', en: 'Shop Rent', bn: 'দোকান ভাড়া' },
  { id: 'Salary', en: 'Staff Salary', bn: 'কর্মচারী বেতন' },
  { id: 'Misc', en: 'Miscellaneous', bn: 'বিবিধ খরচ' },
];

export const pad = (n: number) => String(n).padStart(2, '0');

export const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getCurrentMonth = () => getTodayDate().slice(0, 7);

export const formatMoney = (amount: number | undefined | null): string => {
  const val = Number(amount) || 0;
  return '৳' + val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const getInitialData = (): DokanData => ({
  shop: {
    name: 'বিসমিল্লাহ জেনারেল স্টোর',
    addr: 'দোকান নং ১২, নিউ মার্কেট, ঢাকা',
    phone: '০১৭০০-০০০০০০',
    low: 5,
  },
  products: [
    {
      id: 'p1',
      name: 'তীর সয়াবিন তেল (৫ লিটার বোতল)',
      cat: 'তেল ও ঘি',
      buy: 850,
      sell: 920,
      ws: 880,
      stock: 14,
    },
    {
      id: 'p2',
      name: 'মিনিকেট চাল প্রিমিয়াম (৫০ কেজি বস্তা)',
      cat: 'চাল ও ডাল',
      buy: 3200,
      sell: 3500,
      ws: 3350,
      stock: 20,
    },
    {
      id: 'p3',
      name: 'দেশি মসুর ডাল (১ কেজি)',
      cat: 'চাল ও ডাল',
      buy: 130,
      sell: 155,
      ws: 142,
      stock: 8,
    },
    {
      id: 'p4',
      name: 'ফ্রেশ সাদা চিনি (১ কেজি প্যাকেট)',
      cat: 'মুদি পণ্য',
      buy: 120,
      sell: 135,
      ws: 128,
      stock: 3, // Low stock demo
    },
    {
      id: 'p5',
      name: 'প্রাণ গুঁড়া দুধ (৫০০ গ্রাম)',
      cat: 'দুগ্ধজাত',
      buy: 390,
      sell: 440,
      ws: 410,
      stock: 6,
    },
  ],
  sales: [
    {
      id: 's1',
      no: 'INV-0001',
      type: 'retail',
      date: getTodayDate(),
      time: '10:30 AM',
      customer: 'আব্দুল করিম',
      phone: '01711223344',
      disc: 20,
      sub: 1075,
      total: 1055,
      items: [
        { id: 'p1', n: 'তীর সয়াবিন তেল (৫ লিটার বোতল)', p: 920, c: 850, q: 1 },
        { id: 'p3', n: 'দেশি মসুর ডাল (১ কেজি)', p: 155, c: 130, q: 1 },
      ],
    },
    {
      id: 'ws1',
      no: 'WS-0001',
      type: 'ws',
      date: getTodayDate(),
      time: '11:15 AM',
      customer: 'মেসার্স ভাই ভাই ট্রেডার্স',
      phone: '01819887766',
      addr: 'চকবাজার, ঢাকা',
      dt: 'flat',
      dv: 200,
      disc: 200,
      sub: 10050,
      transport: 300,
      total: 9850,
      grand: 10150,
      paid: 6000,
      due: 4150,
      pays: [],
      items: [
        { id: 'p2', n: 'মিনিকেট চাল প্রিমিয়াম (৫০ কেজি বস্তা)', p: 3350, c: 3200, q: 3 },
      ],
    },
  ],
  expenses: [
    {
      id: 'e1',
      cat: 'Electricity',
      amt: 2400,
      date: getTodayDate(),
      note: 'চলতি মাসের দোকান বিদ্যুৎ বিল',
    },
  ],
  seq: 2,
  wseq: 2,
});

export function loadDokanData(userId?: string): DokanData {
  const storageKey = userId ? `${KEY_PREFIX}.u.${userId}` : KEY_PREFIX;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getInitialData(),
        ...parsed,
        shop: { ...getInitialData().shop, ...(parsed.shop || {}) },
      };
    }
  } catch (e) {
    console.error('Failed to load store data:', e);
  }
  return getInitialData();
}

export function saveDokanData(data: DokanData, userId?: string): void {
  const storageKey = userId ? `${KEY_PREFIX}.u.${userId}` : KEY_PREFIX;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save store data:', e);
  }
}

export interface AuthState {
  users: UserAccount[];
  session: { uid: string; at: number; exp: number } | null;
}

export function loadAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return { users: [], session: null };
}

export function saveAuthState(state: AuthState): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch (e) {}
}
