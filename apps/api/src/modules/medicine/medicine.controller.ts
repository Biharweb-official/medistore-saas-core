import { Controller, Get, Post, Body, Param, Put, Req } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { CreateMedicineDto, UpdateMedicineDto } from './dto/medicine.dto';

@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateMedicineDto) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    const userId = req.user?.id || 'system-user';
    return await this.medicineService.create(tenantId, userId, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    return await this.medicineService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    return await this.medicineService.findOne(tenantId, id);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateMedicineDto) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    return await this.medicineService.update(tenantId, id, dto);
  }
}
