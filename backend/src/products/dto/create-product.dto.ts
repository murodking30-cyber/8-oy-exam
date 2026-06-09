import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Portland Cement 50kg' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'High quality Portland cement bag' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 12.5 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'bag', default: 'pcs' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'CEM-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  categoryId?: number;
}
