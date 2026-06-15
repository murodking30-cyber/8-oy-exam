import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly repo: Repository<Expense>,
  ) {}

  create(dto: CreateExpenseDto): Promise<Expense> {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(): Promise<Expense[]> {
    return this.repo.find({ order: { date: 'DESC', createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Expense> {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`Xarajat #${id} topilmadi`);
    return e;
  }

  async update(id: number, dto: UpdateExpenseDto): Promise<Expense> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  getSumByDateRange(from: string, to: string) {
    return this.repo
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'total')
      .where('e.date >= :from', { from })
      .andWhere('e.date <= :to', { to })
      .getRawOne<{ total: string }>();
  }
}
