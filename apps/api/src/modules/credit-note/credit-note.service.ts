import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCreditNoteDto } from './dto/credit-note.dto';

@Injectable()
export class CreditNoteService {
  constructor(private prisma: PrismaService) {}

  async processCreditNote(tenantId: string, userId: string, dto: CreateCreditNoteDto) {
    return await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sales.findFirst({
        where: { id: dto.originalSaleId, tenantId },
        include: { items: true },
      });

      if (!sale) {
        throw new BadRequestException('Original sale not found');
      }

      const creditNote = await tx.creditNote.create({
        data: {
          tenantId,
          originalSaleId: dto.originalSaleId,
          reason: dto.reason,
          createdBy: userId,
          items: {
            create: dto.items.map((item) => ({
              saleItemId: item.saleItemId,
              quantityTablets: item.quantityTablets,
              reason: item.reason,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of dto.items) {
        const saleItem = sale.items.find((si) => si.id === item.saleItemId);
        if (!saleItem) {
          throw new BadRequestException(`Sale item not found: ${item.saleItemId}`);
        }

        await tx.inventoryBatch.update({
          where: { id: saleItem.batchId },
          data: {
            quantityTablets: {
              increment: item.quantityTablets,
            },
          },
        });
      }

      return creditNote;
    });
  }
}
