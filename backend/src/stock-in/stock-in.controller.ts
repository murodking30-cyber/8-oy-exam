import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { StockInService } from './stock-in.service';

@ApiTags('StockIn')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock-in')
export class StockInController {
  constructor(private readonly service: StockInService) {}

  @Post()
  @ApiOperation({ summary: 'Ombor kirim qo\'shish' })
  create(@Body() dto: CreateStockInDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha kirimlar ro\'yxati' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Kirim ma\'lumoti' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kirimni bekor qilish (stokni kamaytiradi)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
