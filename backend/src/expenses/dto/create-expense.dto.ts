import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ExpenseCategory } from '../entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.ELEKTR })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-06-12' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Iyun oyi elektr hisobi' })
  @IsOptional()
  @IsString()
  note?: string;
}
