import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddPaymentDto } from './dto/add-payment.dto';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { DebtorsService } from './debtors.service';

@ApiTags('Debtors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('debtors')
export class DebtorsController {
  constructor(private readonly service: DebtorsService) {}

  @Post()
  @ApiOperation({ summary: "Qarzdor qo'shish" })
  create(@Body() dto: CreateDebtorDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha qarzdorlar' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: "Qarzdor ma'lumoti" })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Qarzdorni yangilash' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDebtorDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: "To'lov qo'shish" })
  addPayment(@Param('id', ParseIntPipe) id: number, @Body() dto: AddPaymentDto) {
    return this.service.addPayment(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Qarzdorni o'chirish" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
