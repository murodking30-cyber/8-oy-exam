export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'kassir' | 'omborchi';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterResponse {
  message: string;
  contact: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'elektr' | 'transport' | 'ish_haqi' | 'internet' | 'boshqa';

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  image?: string;
  price: number;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  unit: string;
  sku?: string;
  lowStockLimit: number;
  category?: Category;
  categoryId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockIn {
  id: number;
  productId: number;
  product?: Product;
  supplierId?: number;
  supplier?: Supplier;
  quantity: number;
  unit: string;
  purchasePrice: number;
  totalCost: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface PeriodStats {
  sales: number;
  purchases: number;
  expenses: number;
  profit: number;
  soldQuantity: number;
}

export interface DailyStats {
  date: string;
  sales: number;
  purchases: number;
  profit: number;
}

export interface MonthlyStats {
  month: string;
  sales: number;
  purchases: number;
  profit: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  unit: string;
  lowStockLimit: number;
}

export interface InventoryStats {
  today: PeriodStats;
  thisMonth: PeriodStats;
  thisYear: PeriodStats;
  charts: {
    daily: DailyStats[];
    monthly: MonthlyStats[];
  };
  topProducts: TopProduct[];
  lowStock: LowStockItem[];
  totalProducts: number;
  totalStockValue: number;
}
