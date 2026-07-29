import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSaleDto } from './dto/sales.dto';
import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private getFinancialYearCode(date: Date): string {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const startYear = month >= 4 ? year : year - 1;
    return `${startYear.toString().slice(-2)}${(startYear + 1).toString().slice(-2)}`;
  }

  private normalizeStateCode(code: string): string {
    if (!code) return '';
    const cleaned = code.trim().toUpperCase();
    const match = cleaned.match(/^(\d{2})/);
    return match ? match[1] : cleaned;
  }

  async processSale(tenantId: string, userId: string, dto: CreateSaleDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new UnauthorizedException('Tenant validation failed');

    return await this.prisma.$transaction(async (tx) => {
      let counterpartyState = tenant.stateCode;

      if (dto.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: dto.customerId, tenantId },
        });
        if (!customer) throw new NotFoundException('Customer record not found');
        counterpartyState = customer.stateCode;
      }

      const tenantState = this.normalizeStateCode(tenant.stateCode);
      const counterpartyStateNorm = this.normalizeStateCode(counterpartyState);
      const isIntraState = tenantState === counterpartyStateNorm;

      let accumTaxable = new Decimal(0);
      let accumCgst = new Decimal(0);
      let accumSgst = new Decimal(0);
      let accumIgst = new Decimal(0);

      const invoiceItemsData = [];

      // Deterministic lock order: Sort batch IDs to eliminate deadlocks
      const sortedItems = [...dto.items].sort((a, b) => a.batchId.localeCompare(b.batchId));

      for (const item of sortedItems) {
        const lockedBatches = await tx.$queryRaw<
          Array<{
            id: string;
            productId: string;
            totalTablets: number;
            mrpPerStrip: number;
            tabletsPerStrip: number;
            expiryDate: Date;
            gstPct: number;
            scheduleType: string;
          }>
        >`
          SELECT b.id, b."productId", b."totalTablets", b."mrpPerStrip", b."tabletsPerStrip", b."expiryDate", p."gstPct", p."scheduleType"
          FROM batches b
          INNER JOIN products p ON b."productId" = p.id
          WHERE b.id = ${item.batchId} AND b."tenantId" = ${tenantId}
          FOR UPDATE;
        `;

        if (!lockedBatches || lockedBatches.length === 0) {
          throw new NotFoundException(`Batch ${item.batchId} does not exist`);
        }

        const batch = lockedBatches[0];

        if (!batch.tabletsPerStrip || batch.tabletsPerStrip <= 0) {
          throw new BadRequestException(
            `Batch ${batch.id} has invalid packaging configuration (tabletsPerStrip <= 0)`
          );
        }

        if (new Date(batch.expiryDate) <= new Date()) {
          throw new BadRequestException(`Batch ${item.batchId} has expired`);
        }

        if (
          (batch.scheduleType === 'SCHEDULE_H1' || batch.scheduleType === 'SCHEDULE_X') &&
          (!dto.prescriberDoctorName || !dto.patientName)
        ) {
          throw new BadRequestException(
            `Batch ${batch.id} contains Schedule H1/X drug. Prescriber Doctor Name and Patient Name are required.`
          );
        }

        if (batch.totalTablets < item.quantityTablets) {
          throw new BadRequestException(
            `Insufficient stock in batch ${batch.id}. Requested: ${item.quantityTablets}, Available: ${batch.totalTablets}`
          );
        }

        await tx.batch.update({
          where: { id: item.batchId },
          data: { totalTablets: { decrement: item.quantityTablets } },
        });

        const mrpPerStrip = new Decimal(batch.mrpPerStrip.toString());
        const tabletsPerStrip = new Decimal(batch.tabletsPerStrip);
        const unitPrice = mrpPerStrip.div(tabletsPerStrip);

        const qty = new Decimal(item.quantityTablets);
        const lineTaxable = qty.mul(unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        const gstRate = new Decimal(batch.gstPct.toString());

        let lineCgst = new Decimal(0);
        let lineSgst = new Decimal(0);
        let lineIgst = new Decimal(0);

        if (!dto.isReverseCharge) {
          if (isIntraState) {
            const halfRate = gstRate.div(2);
            lineCgst = lineTaxable.mul(halfRate.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            lineSgst = lineTaxable.mul(halfRate.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
          } else {
            lineIgst = lineTaxable.mul(gstRate.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
          }
        }

        accumTaxable = accumTaxable.add(lineTaxable);
        accumCgst = accumCgst.add(lineCgst);
        accumSgst = accumSgst.add(lineSgst);
        accumIgst = accumIgst.add(lineIgst);

        invoiceItemsData.push({
          batchId: item.batchId,
          quantityTablets: item.quantityTablets,
          unitPrice: unitPrice.toFixed(4),
          gstPct: gstRate.toFixed(2),
          taxableValue: lineTaxable.toFixed(2),
        });
      }

      const totalUnrounded = accumTaxable.add(accumCgst).add(accumSgst).add(accumIgst);
      const grandTotal = totalUnrounded.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

      const finYear = this.getFinancialYearCode(new Date());
      const rawTenantKey = tenantId.replace(/-/g, '_');

      const seqResult = await tx.$queryRaw<Array<{ next_val: bigint }>>`
        SELECT nextval('tenant_inv_seq_' || ${rawTenantKey} || '_' || ${finYear}) as next_val;
      `;

      const seqNum = seqResult[0].next_val.toString().padStart(5, '0');
      const invoiceNumber = `INV/${finYear}/${seqNum}`;

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          customerId: dto.customerId,
          subTotal: accumTaxable.toFixed(2),
          cgstAmount: accumCgst.toFixed(2),
          sgstAmount: accumSgst.toFixed(2),
          igstAmount: accumIgst.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
          isReverseCharge: dto.isReverseCharge || false,
          items: { create: invoiceItemsData },
        },
      });

      // Post General Ledger Entries
      await tx.generalLedger.create({
        data: {
          tenantId,
          accountName: dto.customerId ? 'ACCOUNTS_RECEIVABLE' : 'CASH_IN_HAND',
          debit: grandTotal.toFixed(2),
          credit: '0.00',
          referenceId: invoice.id,
          description: `Sales Invoice Ref: ${invoice.invoiceNumber}`,
        },
      });

      await tx.generalLedger.create({
        data: {
          tenantId,
          accountName: 'SALES_REVENUE',
          debit: '0.00',
          credit: accumTaxable.toFixed(2),
          referenceId: invoice.id,
          description: `Sales Revenue Ref: ${invoice.invoiceNumber}`,
        },
      });

      if (accumCgst.gt(0)) {
        await tx.generalLedger.create({
          data: {
            tenantId,
            accountName: 'OUTPUT_CGST_PAYABLE',
            debit: '0.00',
            credit: accumCgst.toFixed(2),
            referenceId: invoice.id,
            description: `Output CGST Ref: ${invoice.invoiceNumber}`,
          },
        });
      }

      if (accumSgst.gt(0)) {
        await tx.generalLedger.create({
          data: {
            tenantId,
            accountName: 'OUTPUT_SGST_PAYABLE',
            debit: '0.00',
            credit: accumSgst.toFixed(2),
            referenceId: invoice.id,
            description: `Output SGST Ref: ${invoice.invoiceNumber}`,
          },
        });
      }

      if (accumIgst.gt(0)) {
        await tx.generalLedger.create({
          data: {
            tenantId,
            accountName: 'OUTPUT_IGST_PAYABLE',
            debit: '0.00',
            credit: accumIgst.toFixed(2),
            referenceId: invoice.id,
            description: `Output IGST Ref: ${invoice.invoiceNumber}`,
          },
        });
      }

      if (dto.customerId) {
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { balance: { increment: grandTotal.toNumber() } },
        });
      }

      return invoice;
    });
  }
}
