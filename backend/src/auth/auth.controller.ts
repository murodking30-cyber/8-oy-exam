import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { VerifyDto } from './dto/verify.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: "Ro'yxatdan o'tish (email tasdiqlash yuboriladi)" })
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy foydalanuvchi profili' })
  getMe(@Req() req: any) {
    return req.user;
  }

  @Get('google')
  @ApiOperation({ summary: 'Google orqali kirish' })
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google callback' })
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    try {
      const result = await this.authService.registerWithGoogle(req.user);
      const encoded = encodeURIComponent(result.token);
      return res.redirect(`${frontendUrl}/auth/google?token=${encoded}`);
    } catch {
      return res.redirect(`${frontendUrl}/login?error=google_failed`);
    }
  }
}
