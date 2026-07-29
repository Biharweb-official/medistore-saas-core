import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(tenantId: string) {
    const totalMedicines = await this.prisma.medicine.count({
      where: { tenantId },
    });

    const totalInvoices = await this.prisma.invoice.count({
      where: { tenantId },
    });

    const aggregateSales = await this.prisma.invoice.aggregate({
      where: { tenantId },
      _sum: {
        finalAmount: true,
        amountPaid: true,
        balanceDue: true,
      },
    });

    const lowStockBatches = await this.prisma.inventoryBatch.count({
      where: {
        tenantId,
        quantityTablets: { lte: 10 },
      },
    });

    return {
      totalMedicines,
      totalInvoices,
      totalSales: aggregateSales._sum.finalAmount || 0,
      totalCollected: aggregateSales._sum.amountPaid || 0,
      totalOutstanding: aggregateSales._sum.balanceDue || 0,
      lowStockBatchesCount: lowStockBatches,
    };
  }
}
