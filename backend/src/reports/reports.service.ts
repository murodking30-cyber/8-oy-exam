import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async getSalesSummary() {
    const orders = await this.orderRepo.find();
    const payments = await this.paymentRepo.find({
      where: { status: PaymentStatus.COMPLETED },
    });

    const totalRevenue = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.status === OrderStatus.PENDING,
    ).length;
    const completedOrders = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED,
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === OrderStatus.CANCELLED,
    ).length;

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    };
  }

  async getTopProducts(limit = 10) {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoin('product.orderItems', 'item')
      .select([
        'product.id',
        'product.name',
        'product.price',
        'product.stock',
      ])
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'totalSold')
      .addSelect('COALESCE(SUM(item.total), 0)', 'totalRevenue')
      .groupBy('product.id')
      .orderBy('"totalSold"', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopCustomers(limit = 10) {
    return this.customerRepo
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .select([
        'customer.id',
        'customer.name',
        'customer.email',
        'customer.company',
      ])
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(order.total), 0)', 'totalSpent')
      .groupBy('customer.id')
      .orderBy('"totalSpent"', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getLowStockProducts(threshold = 10) {
    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.stock <= :threshold', { threshold })
      .orderBy('product.stock', 'ASC')
      .getMany();
  }

  async getRevenueByMonth() {
    return this.paymentRepo
      .createQueryBuilder('payment')
      .select("TO_CHAR(payment.paidAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(payment.amount)', 'revenue')
      .addSelect('COUNT(payment.id)', 'paymentCount')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('payment.paidAt IS NOT NULL')
      .groupBy("TO_CHAR(payment.paidAt, 'YYYY-MM')")
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();
  }

  async getOrdersByStatus() {
    return this.orderRepo
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.total)', 'totalValue')
      .groupBy('order.status')
      .getRawMany();
  }
}
