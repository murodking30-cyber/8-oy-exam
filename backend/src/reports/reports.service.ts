import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { StockIn } from '../stock-in/entities/stock-in.entity';
import { StockOut } from '../stock-out/entities/stock-out.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(StockIn)
    private readonly stockInRepo: Repository<StockIn>,
    @InjectRepository(StockOut)
    private readonly stockOutRepo: Repository<StockOut>,
  ) {}

  private today() {
    return new Date().toISOString().split('T')[0];
  }
  private monthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }
  private yearStart() {
    return `${new Date().getFullYear()}-01-01`;
  }

  private async getSalesSummary(from: string, to: string) {
    const sales = await this.stockOutRepo
      .createQueryBuilder('so')
      .select('COALESCE(SUM(so.totalAmount),0)', 'totalAmount')
      .addSelect('COALESCE(SUM(so.quantity),0)', 'totalQuantity')
      .where('so.date >= :from', { from })
      .andWhere('so.date <= :to', { to })
      .getRawOne();

    const purchases = await this.stockInRepo
      .createQueryBuilder('si')
      .select('COALESCE(SUM(si.totalCost),0)', 'totalCost')
      .where('si.date >= :from', { from })
      .andWhere('si.date <= :to', { to })
      .getRawOne();

    const totalAmount = Number(sales?.totalAmount ?? 0);
    const totalCost = Number(purchases?.totalCost ?? 0);
    return {
      sales: totalAmount,
      purchases: totalCost,
      profit: totalAmount - totalCost,
      soldQuantity: Number(sales?.totalQuantity ?? 0),
    };
  }

  async getInventoryStats() {
    const today = this.today();
    const monthStart = this.monthStart();
    const yearStart = this.yearStart();

    const [todayStats, monthStats, yearStats] = await Promise.all([
      this.getSalesSummary(today, today),
      this.getSalesSummary(monthStart, today),
      this.getSalesSummary(yearStart, today),
    ]);

    const dailySales = await this.stockOutRepo
      .createQueryBuilder('so')
      .select('so.date', 'date')
      .addSelect('COALESCE(SUM(so.totalAmount),0)', 'sales')
      .where(`so.date >= (CURRENT_DATE - INTERVAL '30 days')::text`)
      .groupBy('so.date')
      .orderBy('so.date', 'ASC')
      .getRawMany();

    const dailyPurchases = await this.stockInRepo
      .createQueryBuilder('si')
      .select('si.date', 'date')
      .addSelect('COALESCE(SUM(si.totalCost),0)', 'purchases')
      .where(`si.date >= (CURRENT_DATE - INTERVAL '30 days')::text`)
      .groupBy('si.date')
      .orderBy('si.date', 'ASC')
      .getRawMany();

    const purchaseMap = new Map(dailyPurchases.map((r) => [r.date, Number(r.purchases)]));
    const daily = dailySales.map((r) => ({
      date: r.date,
      sales: Number(r.sales),
      purchases: purchaseMap.get(r.date) ?? 0,
      profit: Number(r.sales) - (purchaseMap.get(r.date) ?? 0),
    }));

    const monthlySales = await this.stockOutRepo
      .createQueryBuilder('so')
      .select("TO_CHAR(so.date::date, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(so.totalAmount),0)', 'sales')
      .where(`so.date >= (CURRENT_DATE - INTERVAL '12 months')::text`)
      .groupBy("TO_CHAR(so.date::date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    const monthlyPurchases = await this.stockInRepo
      .createQueryBuilder('si')
      .select("TO_CHAR(si.date::date, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(si.totalCost),0)', 'purchases')
      .where(`si.date >= (CURRENT_DATE - INTERVAL '12 months')::text`)
      .groupBy("TO_CHAR(si.date::date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    const monthPurchaseMap = new Map(monthlyPurchases.map((r) => [r.month, Number(r.purchases)]));
    const monthly = monthlySales.map((r) => ({
      month: r.month,
      sales: Number(r.sales),
      purchases: monthPurchaseMap.get(r.month) ?? 0,
      profit: Number(r.sales) - (monthPurchaseMap.get(r.month) ?? 0),
    }));

    const topProducts = await this.stockOutRepo
      .createQueryBuilder('so')
      .leftJoin('so.product', 'p')
      .select('so.productId', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('p.unit', 'unit')
      .addSelect('COALESCE(SUM(so.quantity),0)', 'totalQuantity')
      .addSelect('COALESCE(SUM(so.totalAmount),0)', 'totalAmount')
      .where('so.date >= :monthStart', { monthStart })
      .groupBy('so.productId')
      .addGroupBy('p.name')
      .addGroupBy('p.unit')
      .orderBy('"totalAmount"', 'DESC')
      .limit(5)
      .getRawMany();

    const lowStock = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.stock <= p.lowStockLimit')
      .orderBy('p.stock', 'ASC')
      .take(10)
      .getMany();

    const totalProducts = await this.productRepo.count();
    const stockValueRaw = await this.productRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(CAST(p.stock AS decimal) * CAST(p.purchasePrice AS decimal)),0)', 'value')
      .getRawOne();

    return {
      today: todayStats,
      thisMonth: monthStats,
      thisYear: yearStats,
      charts: { daily, monthly },
      topProducts,
      lowStock,
      totalProducts,
      totalStockValue: Number(stockValueRaw?.value ?? 0),
    };
  }

  async getLowStockProducts(threshold?: number) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .orderBy('p.stock', 'ASC');
    if (threshold !== undefined) {
      qb.where('p.stock <= :threshold', { threshold });
    } else {
      qb.where('p.stock <= p.lowStockLimit');
    }
    return qb.getMany();
  }

  async getTopProducts(limit = 10) {
    return this.stockOutRepo
      .createQueryBuilder('so')
      .leftJoin('so.product', 'p')
      .select('so.productId', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('p.unit', 'unit')
      .addSelect('COALESCE(SUM(so.quantity),0)', 'totalQuantity')
      .addSelect('COALESCE(SUM(so.totalAmount),0)', 'totalAmount')
      .groupBy('so.productId')
      .addGroupBy('p.name')
      .addGroupBy('p.unit')
      .orderBy('"totalAmount"', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getRevenueByMonth() {
    return this.stockOutRepo
      .createQueryBuilder('so')
      .select("TO_CHAR(so.date::date, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(so.totalAmount),0)', 'revenue')
      .groupBy("TO_CHAR(so.date::date, 'YYYY-MM')")
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();
  }
}
