import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment, PaymentStatus } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  create(dto: CreatePaymentDto): Promise<Payment> {
    const payment = this.repo.create(dto);
    return this.repo.save(payment);
  }

  findAll(): Promise<Payment[]> {
    return this.repo.find({
      relations: { order: { customer: true } },
      order: { createdAt: 'DESC' },
    });
  }

  findByOrder(orderId: number): Promise<Payment[]> {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.repo.findOne({
      where: { id },
      relations: { order: true },
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async update(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    if (dto.status) {
      payment.status = dto.status;
      if (dto.status === PaymentStatus.COMPLETED && !payment.paidAt) {
        payment.paidAt = new Date();
      }
    }
    if (dto.notes !== undefined) payment.notes = dto.notes;
    return this.repo.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.repo.remove(payment);
  }
}
