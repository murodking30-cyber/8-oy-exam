import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddPaymentDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ example: 'Naqd to\'lov' })
  @IsOptional()
  @IsString()
  note?: string;
}
