import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventory-stats')
  @ApiOperation({ summary: 'Inventar statistikasi (bugun, oy, yil, grafiklar)' })
  getInventoryStats() {
    return this.reportsService.getInventoryStats();
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Eng ko\'p sotilgan mahsulotlar' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopProducts(@Query('limit') limit?: string) {
    return this.reportsService.getTopProducts(limit ? +limit : 10);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Kam qolgan mahsulotlar' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  getLowStockProducts(@Query('threshold') threshold?: string) {
    return this.reportsService.getLowStockProducts(threshold ? +threshold : undefined);
  }

  @Get('revenue-by-month')
  @ApiOperation({ summary: 'Oylik daromad' })
  getRevenueByMonth() {
    return this.reportsService.getRevenueByMonth();
  }
}
