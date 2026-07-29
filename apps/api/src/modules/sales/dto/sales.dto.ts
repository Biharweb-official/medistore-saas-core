export class SaleItemDto {
  batchId: string;
  quantityTablets: number;
}

export class CreateSaleDto {
  customerId?: string;
  isReverseCharge?: boolean;
  prescriberDoctorName?: string;
  patientName?: string;
  items: SaleItemDto[];
}
