import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ResendCodeDto } from './dto/resend-code.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: "Yangi foydalanuvchini ro'yxatdan o'tkazish" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Tasdiqlash kodi orqali hisobni tasdiqlash' })
  verify(@Body() dto: VerifyDto) {
    return this.authService.verify(dto);
  }

  @Post('resend-code')
  @ApiOperation({ summary: 'Tasdiqlash kodini qayta yuborish' })
  resendCode(@Body() dto: ResendCodeDto) {
    return this.authService.resendCode(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Email yoki telefon orqali kirish' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
