import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  image: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  purchasePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  salePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  stock: number;

  @Column({ type: 'int', default: 10 })
  lowStockLimit: number;

  @Column({ default: 'dona' })
  unit: string;

  @Column({ nullable: true, unique: true, type: 'varchar' })
  sku: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
