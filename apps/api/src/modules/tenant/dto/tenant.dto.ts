export class CreateTenantDto {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  dlNumber?: string;
}

export class UpdateTenantDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  dlNumber?: string;
}
