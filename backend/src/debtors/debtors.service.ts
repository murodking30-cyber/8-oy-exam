import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddPaymentDto } from './dto/add-payment.dto';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { Debtor } from './entities/debtor.entity';

@Injectable()
export class DebtorsService {
  constructor(
    @InjectRepository(Debtor)
    private readonly repo: Repository<Debtor>,
  ) {}

  create(dto: CreateDebtorDto): Promise<Debtor> {
    const debtor = this.repo.create({
      ...dto,
      paidAmount: dto.paidAmount ?? 0,
    });
    return this.repo.save(debtor);
  }

  findAll(): Promise<Debtor[]> {
    return this.repo.find({ order: { debtDate: 'DESC', createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Debtor> {
    const d = await this.repo.findOne({ where: { id } });
    if (!d) throw new NotFoundException(`Qarzdor #${id} topilmadi`);
    return d;
  }

  async update(id: number, dto: UpdateDebtorDto): Promise<Debtor> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async addPayment(id: number, dto: AddPaymentDto): Promise<Debtor> {
    const debtor = await this.findOne(id);
    const remaining = Number(debtor.totalAmount) - Number(debtor.paidAmount);
    if (dto.amount > remaining + 0.001) {
      throw new BadRequestException(
        `To'lov miqdori qolgan qarzdan (${remaining.toLocaleString()} so'm) oshib ketdi`,
      );
    }
    debtor.paidAmount = Number(debtor.paidAmount) + dto.amount;
    debtor.lastPaymentDate = dto.paymentDate;
    if (dto.note) debtor.note = dto.note;
    return this.repo.save(debtor);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
