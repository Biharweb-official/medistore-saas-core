export class BillingItemDto {
  batchId: string;
  quantityTablets: number;
  discountPercentage?: number;
}

export class CreateInvoiceDto {
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  items: BillingItemDto[];
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
  amountPaid: number;
}
