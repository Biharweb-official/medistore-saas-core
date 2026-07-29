import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBatchDto, AdjustStockDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createBatch(tenantId: string, userId: string, dto: CreateBatchDto) {
    return await this.prisma.inventoryBatch.create({
      data: {
        tenantId,
        medicineId: dto.medicineId,
        batchNumber: dto.batchNumber,
        expiryDate: new Date(dto.expiryDate),
        quantityTablets: dto.quantityTablets,
        purchasePricePerTablet: dto.purchasePricePerTablet,
        sellingPricePerTablet: dto.sellingPricePerTablet,
        mrpPerTablet: dto.mrpPerTablet,
        createdBy: userId,
      },
    });
  }

  async adjustStock(tenantId: string, userId: string, dto: AdjustStockDto) {
    const batch = await this.prisma.inventoryBatch.findFirst({
      where: { id: dto.batchId, tenantId },
    });

    if (!batch) {
      throw new BadRequestException('Inventory batch not found');
    }

    return await this.prisma.inventoryBatch.update({
      where: { id: dto.batchId },
      data: {
        quantityTablets: {
          increment: dto.quantityTablets,
        },
      },
    });
  }
}
