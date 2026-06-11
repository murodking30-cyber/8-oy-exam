import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { StockIn } from '../stock-in/entities/stock-in.entity';
import { StockOut } from '../stock-out/entities/stock-out.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, StockIn, StockOut])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
