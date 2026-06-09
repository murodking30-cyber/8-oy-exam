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

  @Get('sales-summary')
  @ApiOperation({ summary: 'Overall sales summary' })
  getSalesSummary() {
    return this.reportsService.getSalesSummary();
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopProducts(@Query('limit') limit?: string) {
    return this.reportsService.getTopProducts(limit ? +limit : 10);
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Top customers by spending' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopCustomers(@Query('limit') limit?: string) {
    return this.reportsService.getTopCustomers(limit ? +limit : 10);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Products with low stock' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  getLowStockProducts(@Query('threshold') threshold?: string) {
    return this.reportsService.getLowStockProducts(threshold ? +threshold : 10);
  }

  @Get('revenue-by-month')
  @ApiOperation({ summary: 'Monthly revenue breakdown' })
  getRevenueByMonth() {
    return this.reportsService.getRevenueByMonth();
  }

  @Get('orders-by-status')
  @ApiOperation({ summary: 'Order counts grouped by status' })
  getOrdersByStatus() {
    return this.reportsService.getOrdersByStatus();
  }
}
