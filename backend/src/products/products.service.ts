import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create({
      ...dto,
      price: dto.salePrice ?? 0,
      salePrice: dto.salePrice ?? 0,
      purchasePrice: dto.purchasePrice ?? 0,
      stock: dto.stock ?? 0,
      lowStockLimit: dto.lowStockLimit ?? 10,
      unit: dto.unit ?? 'dona',
      sku: dto.sku?.trim() || undefined,
    });
    return this.repo.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.repo.find({
      relations: { category: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) throw new NotFoundException(`Mahsulot #${id} topilmadi`);
    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const patch: Partial<Product> = { ...dto } as any;
    if (dto.salePrice !== undefined) patch.price = dto.salePrice;
    if (dto.sku !== undefined) (patch as any).sku = dto.sku?.trim() || null;
    Object.assign(product, patch);
    return this.repo.save(product);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async adjustStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stock = Math.max(0, product.stock + quantity);
    return this.repo.save(product);
  }

  getLowStock(limit = 10): Promise<Product[]> {
    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.stock <= p.lowStockLimit')
      .orderBy('p.stock', 'ASC')
      .take(limit)
      .getMany();
  }
}
