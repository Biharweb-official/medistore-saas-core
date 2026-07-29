import { Module } from '@nestjs/common';
import { CreditNoteController } from './credit-note.controller';
import { CreditNoteService } from './credit-note.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CreditNoteController],
  providers: [CreditNoteService],
})
export class CreditNoteModule {}
