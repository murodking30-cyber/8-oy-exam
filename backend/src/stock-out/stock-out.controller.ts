import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStockOutDto } from './dto/create-stock-out.dto';
import { StockOutService } from './stock-out.service';

@ApiTags('StockOut')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock-out')
export class StockOutController {
  constructor(private readonly service: StockOutService) {}

  @Post()
  @ApiOperation({ summary: 'Sotuv / Chiqim qo\'shish' })
  create(@Body() dto: CreateStockOutDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha sotuv/chiqimlar ro\'yxati' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sotuv ma\'lumoti' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Sotuvni bekor qilish (stokni qaytaradi)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
