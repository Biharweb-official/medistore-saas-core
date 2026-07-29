import { Controller, Post, Body, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/billing.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoice')
  async createInvoice(@Req() req: any, @Body() dto: CreateInvoiceDto) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    const userId = req.user?.id || 'system-user';
    return await this.billingService.createInvoice(tenantId, userId, dto);
  }
}
