import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Debtor } from './entities/debtor.entity';
import { DebtorsController } from './debtors.controller';
import { DebtorsService } from './debtors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Debtor])],
  controllers: [DebtorsController],
  providers: [DebtorsService],
})
export class DebtorsModule {}
