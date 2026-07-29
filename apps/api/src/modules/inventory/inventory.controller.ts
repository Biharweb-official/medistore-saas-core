import { Controller, Post, Body, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateBatchDto, AdjustStockDto } from './dto/inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('batches')
  async createBatch(@Req() req: any, @Body() dto: CreateBatchDto) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    const userId = req.user?.id || 'system-user';
    return await this.inventoryService.createBatch(tenantId, userId, dto);
  }

  @Post('adjust')
  async adjustStock(@Req() req: any, @Body() dto: AdjustStockDto) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    const userId = req.user?.id || 'system-user';
    return await this.inventoryService.adjustStock(tenantId, userId, dto);
  }
}
