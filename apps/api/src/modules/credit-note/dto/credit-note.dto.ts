export class CreditNoteItemDto {
  saleItemId: string;
  quantityTablets: number;
  reason: string;
}

export class CreateCreditNoteDto {
  originalSaleId: string;
  reason: string;
  items: CreditNoteItemDto[];
}
