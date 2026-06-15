import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { StockIn } from './entities/stock-in.entity';

@Injectable()
export class StockInService {
  constructor(
    @InjectRepository(StockIn)
    private readonly repo: Repository<StockIn>,
    private readonly productsService: ProductsService,
  ) {}

  async create(dto: CreateStockInDto): Promise<StockIn> {
    const product = await this.productsService.findOne(dto.productId);
    const purchasePrice = dto.purchasePrice ?? Number(product.purchasePrice) ?? 0;
    const totalCost = Number(dto.quantity) * purchasePrice;

    const record = this.repo.create({
      productId: dto.productId,
      quantity: dto.quantity,
      unit: dto.unit ?? product.unit,
      purchasePrice,
      totalCost,
      date: dto.date,
      note: dto.note,
      supplierId: dto.supplierId ?? null,
    });
    const saved = await this.repo.save(record);
    await this.productsService.adjustStock(dto.productId, Number(dto.quantity));
    return this.repo.findOne({ where: { id: saved.id }, relations: { product: true, supplier: true } }) as Promise<StockIn>;
  }

  findAll(): Promise<StockIn[]> {
    return this.repo.find({
      relations: { product: true, supplier: true },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<StockIn> {
    const r = await this.repo.findOne({ where: { id }, relations: { product: true, supplier: true } });
    if (!r) throw new NotFoundException(`Kirim #${id} topilmadi`);
    return r;
  }

  async remove(id: number): Promise<void> {
    const r = await this.findOne(id);
    await this.productsService.adjustStock(r.productId, -Number(r.quantity));
    await this.repo.delete(id);
  }

  getSummaryByDateRange(from: string, to: string) {
    return this.repo
      .createQueryBuilder('si')
      .leftJoin('si.product', 'p')
      .select('SUM(si.totalCost)', 'totalCost')
      .addSelect('SUM(si.quantity)', 'totalQuantity')
      .where('si.date >= :from', { from })
      .andWhere('si.date <= :to', { to })
      .getRawOne();
  }

  getDailyByDateRange(from: string, to: string) {
    return this.repo
      .createQueryBuilder('si')
      .select('si.date', 'date')
      .addSelect('SUM(si.totalCost)', 'totalCost')
      .where('si.date >= :from', { from })
      .andWhere('si.date <= :to', { to })
      .groupBy('si.date')
      .orderBy('si.date', 'ASC')
      .getRawMany();
  }

  getMonthlyByDateRange(from: string, to: string) {
    return this.repo
      .createQueryBuilder('si')
      .select("TO_CHAR(si.date::date, 'YYYY-MM')", 'month')
      .addSelect('SUM(si.totalCost)', 'totalCost')
      .where('si.date >= :from', { from })
      .andWhere('si.date <= :to', { to })
      .groupBy("TO_CHAR(si.date::date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();
  }
}
