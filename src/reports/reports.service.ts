import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(tenantId: string) {
    try {
      const [totalProducts, lowStockProducts, totalSalesAggregate, totalRevenueAggregate] = await Promise.all([
        this.prisma.product.count({ where: { tenantId } }),
        this.prisma.product.count({
          where: {
            tenantId,
            stock: { lte: this.prisma.product.fields.minStockAlert },
          },
        }),
        this.prisma.sale.count({ where: { tenantId } }),
        this.prisma.sale.aggregate({
          where: { tenantId },
          _sum: { totalAmount: true },
        }),
      ]);

      return {
        metrics: {
          totalProducts,
          lowStockProducts,
          totalSalesTransactions: totalSalesAggregate,
          totalRevenue: totalRevenueAggregate._sum.totalAmount || 0,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate dashboard analytics summary.');
    }
  }
}
