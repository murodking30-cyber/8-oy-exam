import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    private readonly productsService: ProductsService,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepo.create({
      customerId: dto.customerId,
      notes: dto.notes,
      items: [],
    });

    let subtotal = 0;

    for (const itemDto of dto.items) {
      const product = await this.productsService.findOne(itemDto.productId);
      if (product.stock < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}`,
        );
      }
      const total = Number(product.price) * itemDto.quantity;
      const item = this.itemRepo.create({
        productId: product.id,
        quantity: itemDto.quantity,
        unitPrice: product.price,
        total,
      });
      order.items.push(item);
      subtotal += total;
    }

    order.subtotal = subtotal;
    order.tax = 0;
    order.total = subtotal;

    const saved = await this.orderRepo.save(order);

    for (const itemDto of dto.items) {
      await this.productsService.adjustStock(itemDto.productId, -itemDto.quantity);
    }

    return saved;
  }

  findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: { customer: true, payments: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { customer: true, items: { product: true }, payments: true },
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    if (dto.status) order.status = dto.status;
    if (dto.notes !== undefined) order.notes = dto.notes;
    return this.orderRepo.save(order);
  }

  async cancel(id: number): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }
    order.status = OrderStatus.CANCELLED;
    for (const item of order.items) {
      await this.productsService.adjustStock(item.productId, item.quantity);
    }
    return this.orderRepo.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepo.remove(order);
  }
}
