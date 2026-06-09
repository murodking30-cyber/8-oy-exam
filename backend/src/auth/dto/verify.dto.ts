import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyDto {
  @ApiProperty({ example: 'ali@example.com yoki +998901234567' })
  @IsString()
  emailOrPhone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Kod 6 xonali bo\'lishi kerak' })
  code: string;
}
