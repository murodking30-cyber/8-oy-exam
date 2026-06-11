import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { StockOut } from './entities/stock-out.entity';
import { StockOutController } from './stock-out.controller';
import { StockOutService } from './stock-out.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockOut]), ProductsModule],
  controllers: [StockOutController],
  providers: [StockOutService],
  exports: [StockOutService],
})
export class StockOutModule {}
