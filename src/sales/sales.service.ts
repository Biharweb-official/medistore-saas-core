import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateSaleDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        let totalAmount = 0;
        const processedItems = [];

        for (const item of dto.items) {
          const product = await prisma.product.findFirst({
            where: { id: item.productId, tenantId },
          });

          if (!product) {
            throw new NotFoundException(`Product with ID '${item.productId}' not found.`);
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(`Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`);
          }

          const unitPrice = Number(product.price);
          const subtotal = unitPrice * item.quantity;
          totalAmount += subtotal;

          // Deduct stock
          await prisma.product.update({
            where: { id: product.id },
            data: { stock: product.stock - item.quantity },
          });

          processedItems.push({
            productId: product.id,
            quantity: item.quantity,
            unitPrice,
            subtotal,
          });
        }

        // Generate sale record with items
        const sale = await prisma.sale.create({
          data: {
            tenantId,
            userId,
            totalAmount,
            items: {
              create: processedItems,
            },
          },
          include: {
            items: {
              include: { product: true },
            },
          },
        });

        return sale;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process sale transaction.');
    }
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where: { tenantId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
