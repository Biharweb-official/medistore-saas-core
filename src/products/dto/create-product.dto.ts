import { IsString, IsNotEmpty, IsNumber, IsPositive, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Paracetamol 650mg', description: 'Name of the medicine or product' })
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  name: string;

  @ApiPropertyOptional({ example: 'Pain relief and fever reduction tablets', description: 'Detailed product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'PARA-650-TAB', description: 'Unique SKU code for inventory tracking' })
  @IsString()
  @IsNotEmpty({ message: 'SKU is required' })
  sku: string;

  @ApiProperty({ example: 25.50, description: 'Selling price per unit' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;

  @ApiProperty({ example: 150, description: 'Current available stock quantity' })
  @IsInt()
  @Min(0, { message: 'Stock quantity cannot be negative' })
  stock: number;

  @ApiProperty({ example: 10, description: 'Low stock threshold alert limit' })
  @IsInt()
  @Min(0)
  minStockAlert: number;
}
