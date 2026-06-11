export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'employee' | 'staff';
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

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
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

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: number;
  orderNumber: string;
  customer?: Customer;
  customerId: number;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: number;
  orderId: number;
  order?: Order;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}
