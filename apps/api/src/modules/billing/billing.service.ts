import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/billing.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(tenantId: string, userId: string, dto: CreateInvoiceDto) {
    let totalAmount = 0;
    const invoiceItemsData = [];

    for (const item of dto.items) {
      const batch = await this.prisma.inventoryBatch.findFirst({
        where: { id: item.batchId, tenantId },
      });

      if (!batch || batch.quantityTablets < item.quantityTablets) {
        throw new BadRequestException(`Insufficient stock for batch ID: ${item.batchId}`);
      }

      const unitPrice = batch.sellingPricePerTablet;
      const itemTotal = unitPrice * item.quantityTablets;
      totalAmount += itemTotal;

      invoiceItemsData.push({
        batchId: item.batchId,
        quantity: item.quantityTablets,
        unitPrice,
        totalPrice: itemTotal,
      });

      await this.prisma.inventoryBatch.update({
        where: { id: item.batchId },
        data: {
          quantityTablets: {
            decrement: item.quantityTablets,
          },
        },
      });
    }

    const balanceDue = totalAmount - dto.amountPaid;

    return await this.prisma.invoice.create({
      data: {
        tenantId,
        patientName: dto.patientName,
        patientPhone: dto.patientPhone,
        doctorName: dto.doctorName,
        totalAmount,
        discountAmount: 0,
        taxAmount: 0,
        finalAmount: totalAmount,
        amountPaid: dto.amountPaid,
        balanceDue: balanceDue > 0 ? balanceDue : 0,
        paymentStatus: balanceDue <= 0 ? 'PAID' : 'PARTIAL',
        createdBy: userId,
        items: {
          create: invoiceItemsData,
        },
      },
      include: { items: true },
    });
  }
}
