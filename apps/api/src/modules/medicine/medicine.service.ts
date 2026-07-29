import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicineDto, UpdateMedicineDto } from './dto/medicine.dto';

@Injectable()
export class MedicineService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateMedicineDto) {
    return await this.prisma.medicine.create({
      data: {
        tenantId,
        name: dto.name,
        genericName: dto.genericName,
        manufacturer: dto.manufacturer,
        category: dto.category,
        hsnCode: dto.hsnCode,
        gstPercentage: dto.gstPercentage ?? 12,
        createdBy: userId,
      },
    });
  }

  async findAll(tenantId: string) {
    return await this.prisma.medicine.findMany({
      where: { tenantId },
      include: { batches: true },
    });
  }

  async findOne(tenantId: string, id: string) {
    const medicine = await this.prisma.medicine.findFirst({
      where: { id, tenantId },
      include: { batches: true },
    });

    if (!medicine) {
      throw new NotFoundException('Medicine not found');
    }

    return medicine;
  }

  async update(tenantId: string, id: string, dto: UpdateMedicineDto) {
    await this.findOne(tenantId, id);

    return await this.prisma.medicine.update({
      where: { id },
      data: dto,
    });
  }
}
