import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDebtorDto {
  @ApiProperty({ example: 'Ahmadov Jasur' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Sement M500' })
  @IsOptional()
  @IsString()
  product?: string;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiProperty({ example: '2026-06-12' })
  @IsDateString()
  debtDate: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  lastPaymentDate?: string;

  @ApiPropertyOptional({ example: 'Sement uchun qarz' })
  @IsOptional()
  @IsString()
  note?: string;
}
