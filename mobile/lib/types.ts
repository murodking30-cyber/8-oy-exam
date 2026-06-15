export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  image?: string;
  stock: number;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  lowStockLimit: number;
  category?: Category;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
}

export interface StockIn {
  id: number;
  productId: number;
  product?: Product;
  supplierId?: number | null;
  supplier?: Supplier | null;
  quantity: number;
  unit: string;
  purchasePrice: number;
  totalCost: number;
  date: string;
  note?: string;
}

export interface StockOut {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  unit: string;
  salePrice: number;
  totalAmount: number;
  date: string;
  customer?: string;
  note?: string;
}

export interface Debtor {
  id: number;
  name: string;
  phone?: string | null;
  product?: string | null;
  quantity?: number | null;
  totalAmount: number;
  paidAmount: number;
  debtDate?: string | null;
  lastPaymentDate?: string | null;
  note?: string | null;
}

export type ExpenseCategory = 'ELEKTR' | 'TRANSPORT' | 'ISH_HAQI' | 'INTERNET' | 'BOSHQA';

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note?: string | null;
}

export interface PeriodStats {
  sales: number;
  purchases: number;
  expenses: number;
  profit: number;
  soldQuantity: number;
}

export interface InventoryStats {
  today: PeriodStats;
  thisMonth: PeriodStats;
  thisYear: PeriodStats;
  topProducts: Array<{
    productId: number;
    productName: string;
    unit?: string;
    totalQuantity: number;
    totalAmount: number;
  }>;
  lowStock: Array<{
    id: number;
    name: string;
    stock: number;
    unit: string;
    lowStockLimit: number;
  }>;
  totalProducts: number;
  totalStockValue: number;
}
