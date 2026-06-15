import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExpenseCategory {
  ELEKTR = 'elektr',
  TRANSPORT = 'transport',
  ISH_HAQI = 'ish_haqi',
  INTERNET = 'internet',
  BOSHQA = 'boshqa',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ExpenseCategory, default: ExpenseCategory.BOSHQA })
  category: ExpenseCategory;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
