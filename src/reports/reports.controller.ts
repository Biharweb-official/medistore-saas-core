import { Controller, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports & Analytics')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private validateAndParseDateRange(startDateStr: string, endDateStr: string) {
    if (!startDateStr ||!endDateStr) {
      throw new BadRequestException('Both startDate and endDate query parameters are required.');
    }
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format supplied. Please use ISO 8601 format (YYYY-MM-DD).');
    }
    if (start > end) {
      throw new BadRequestException('startDate cannot be later than endDate.');
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      throw new BadRequestException('Report date range cannot exceed 366 days to prevent database performance degradation.');
    }
    return { start, end };
  }

  @Get('gstr-1')
  @ApiOperation({ summary: 'Generate GSTR-1 Sales Tax Return Report' })
  async getGstr1Report(@Req() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const { start, end } = this.validateAndParseDateRange(startDate, endDate);
    return this.reportsService.getGstr1Report(req.user.tenantId, start, end);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Generate Profit & Loss Statement' })
  async getProfitLossReport(@Req() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const { start, end } = this.validateAndParseDateRange(startDate, endDate);
    return this.reportsService.getProfitLossReport(req.user.tenantId, start, end);
  }

  @Get('stock-valuation')
  @ApiOperation({ summary: 'Generate Current Stock Valuation Report' })
  async getStockValuationReport(@Req() req: any) {
    return this.reportsService.getStockValuationReport(req.user.tenantId);
  }
}
