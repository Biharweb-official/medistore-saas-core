import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sales.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async createSale(@Req() req: any, @Body() dto: CreateSaleDto) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    const userId = req.user?.id || 'system-user';
    return await this.salesService.processSale(tenantId, userId, dto);
  }
}
