import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { StockIn } from './entities/stock-in.entity';
import { StockInController } from './stock-in.controller';
import { StockInService } from './stock-in.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockIn]), ProductsModule, SuppliersModule],
  controllers: [StockInController],
  providers: [StockInService],
  exports: [StockInService],
})
export class StockInModule {}
