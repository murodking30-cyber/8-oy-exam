import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { CreateStockOutDto } from './dto/create-stock-out.dto';
import { StockOut } from './entities/stock-out.entity';

@Injectable()
export class StockOutService {
  constructor(
    @InjectRepository(StockOut)
    private readonly repo: Repository<StockOut>,
    private readonly productsService: ProductsService,
  ) {}

  async create(dto: CreateStockOutDto): Promise<StockOut> {
    const product = await this.productsService.findOne(dto.productId);
    if (Number(product.stock) < Number(dto.quantity)) {
      throw new BadRequestException(
        `Yetarli mahsulot yo'q. Mavjud: ${Number(product.stock)} ${product.unit}, So'ralgan: ${dto.quantity}`,
      );
    }
    const salePrice = dto.salePrice ?? Number(product.salePrice) ?? Number(product.price) ?? 0;
    const totalAmount = Number(dto.quantity) * salePrice;

    const record = this.repo.create({
      productId: dto.productId,
      quantity: dto.quantity,
      unit: dto.unit ?? product.unit,
      salePrice,
      totalAmount,
      date: dto.date,
      customer: dto.customer,
      note: dto.note,
    });
    const saved = await this.repo.save(record);
    await this.productsService.adjustStock(dto.productId, -Number(dto.quantity));
    return this.repo.findOne({ where: { id: saved.id }, relations: { product: true } }) as Promise<StockOut>;
  }

  findAll(): Promise<StockOut[]> {
    return this.repo.find({
      relations: { product: true },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<StockOut> {
    const r = await this.repo.findOne({ where: { id }, relations: { product: true } });
    if (!r) throw new NotFoundException(`Sotuv #${id} topilmadi`);
    return r;
  }

  async remove(id: number): Promise<void> {
    const r = await this.findOne(id);
    await this.productsService.adjustStock(r.productId, Number(r.quantity));
    await this.repo.delete(id);
  }

  getSummaryByDateRange(from: string, to: string) {
    return this.repo
      .createQueryBuilder('so')
      .select('SUM(so.totalAmount)', 'totalAmount')
      .addSelect('SUM(so.quantity)', 'totalQuantity')
      .where('so.date >= :from', { from })
      .andWhere('so.date <= :to', { to })
      .getRawOne();
  }

  getDailyByDateRange(from: string, to: string) {
    return this.repo
      .createQueryBuilder('so')
      .select('so.date', 'date')
      .addSelect('SUM(so.totalAmount)', 'totalAmount')
      .addSelect('SUM(so.quantity)', 'totalQuantity')
      .where('so.date >= :from', { from })
      .andWhere('so.date <= :to', { to })
      .groupBy('so.date')
      .orderBy('so.date', 'ASC')
      .getRawMany();
  }

  getMonthlyByDateRange(from: string, to: string) {
    return this.repo
      .createQueryBuilder('so')
      .select("TO_CHAR(so.date::date, 'YYYY-MM')", 'month')
      .addSelect('SUM(so.totalAmount)', 'totalAmount')
      .addSelect('SUM(so.quantity)', 'totalQuantity')
      .where('so.date >= :from', { from })
      .andWhere('so.date <= :to', { to })
      .groupBy("TO_CHAR(so.date::date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  getTopProductsByDateRange(from: string, to: string, limit = 10) {
    return this.repo
      .createQueryBuilder('so')
      .leftJoin('so.product', 'p')
      .select('so.productId', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('p.unit', 'unit')
      .addSelect('SUM(so.quantity)', 'totalQuantity')
      .addSelect('SUM(so.totalAmount)', 'totalAmount')
      .where('so.date >= :from', { from })
      .andWhere('so.date <= :to', { to })
      .groupBy('so.productId')
      .addGroupBy('p.name')
      .addGroupBy('p.unit')
      .orderBy('"totalAmount"', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}
