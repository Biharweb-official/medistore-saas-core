import { Controller, Post, Body, Req } from '@nestjs/common';
import { CreditNoteService } from './credit-note.service';
import { CreateCreditNoteDto } from './dto/credit-note.dto';

@Controller('credit-notes')
export class CreditNoteController {
  constructor(private readonly creditNoteService: CreditNoteService) {}

  @Post()
  async createCreditNote(@Req() req: any, @Body() dto: CreateCreditNoteDto) {
    const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
    const userId = req.user?.id || 'system-user';
    return await this.creditNoteService.processCreditNote(tenantId, userId, dto);
  }
}
