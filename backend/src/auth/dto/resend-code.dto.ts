import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResendCodeDto {
  @ApiProperty({ example: 'ali@example.com yoki +998901234567' })
  @IsString()
  emailOrPhone: string;
}
