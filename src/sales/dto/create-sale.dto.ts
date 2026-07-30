import { IsArray, ValidateNested, IsString, IsNotEmpty, IsInt, IsPositive, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SaleItemDto {
  @ApiProperty({ example: 'prod_uuid_123', description: 'Product ID being sold' })
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required for each item' })
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantity of the product being purchased' })
  @IsInt()
  @IsPositive({ message: 'Quantity must be a positive integer' })
  quantity: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [SaleItemDto], description: 'List of items included in the sale invoice' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Invoice must contain at least one product item' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
