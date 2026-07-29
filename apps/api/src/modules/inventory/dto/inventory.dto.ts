export class CreateBatchDto {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantityTablets: number;
  purchasePricePerTablet: number;
  sellingPricePerTablet: number;
  mrpPerTablet: number;
}

export class AdjustStockDto {
  batchId: string;
  quantityTablets: number;
  reason: string;
}
