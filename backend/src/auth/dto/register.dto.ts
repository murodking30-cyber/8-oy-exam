import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Valiyev Ali Baxtiyorovich', description: "F.I.O (to'liq ism)" })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'ali@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}
