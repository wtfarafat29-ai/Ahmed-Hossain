export interface Product {
  id: string;
  name: string;
  cat: string;
  img?: string;
  buy: number;
  sell: number;
  ws: number; // 0 if none
  stock: number | null; // null if untracked
}

export interface SaleItem {
  id: string;
  n: string;
  p: number; // selling price per unit
  c: number; // cost per unit
  q: number; // quantity
}

export interface Sale {
  id: string;
  no: string;
  type?: 'retail' | 'ws';
  date: string; // YYYY-MM-DD
  time?: string;
  customer?: string;
  phone?: string;
  addr?: string;
  dt?: 'flat' | 'pct';
  dv?: number;
  disc: number;
  sub: number;
  total: number;
  transport?: number;
  grand?: number;
  paid?: number;
  due?: number;
  pays?: { date: string; amt: number }[];
  items: SaleItem[];
}

export interface Expense {
  id: string;
  cat: string;
  amt: number;
  date: string;
  note?: string;
}

export interface ShopInfo {
  name: string;
  addr: string;
  phone: string;
  low: number;
}

export interface DokanData {
  shop: ShopInfo;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  seq: number;
  wseq: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  provider: 'local' | 'google';
  created: number;
  shop?: string;
  pw?: { salt: string; hash: string } | null;
}
