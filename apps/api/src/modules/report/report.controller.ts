import { Controller, Get, Req } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  async getDashboardSummary(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    return await this.reportService.getDashboardSummary(tenantId);
  }
}
