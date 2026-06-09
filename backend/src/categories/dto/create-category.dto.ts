import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Cement & Concrete' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Cement, concrete, and related products' })
  @IsOptional()
  @IsString()
  description?: string;
}
