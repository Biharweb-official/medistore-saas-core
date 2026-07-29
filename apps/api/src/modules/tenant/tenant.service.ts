import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    return await this.prisma.tenant.create({
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        gstin: dto.gstin,
        dlNumber: dto.dlNumber,
      },
    });
  }

  async findAll() {
    return await this.prisma.tenant.findMany();
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);

    return await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }
}
