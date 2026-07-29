export class CreateMedicineDto {
  name: string;
  genericName?: string;
  manufacturer: string;
  category?: string;
  hsnCode?: string;
  gstPercentage?: number;
}

export class UpdateMedicineDto {
  name?: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  hsnCode?: string;
  gstPercentage?: number;
}
