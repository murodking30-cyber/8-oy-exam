import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { FindOptionsSelect, Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Bu elektron pochta allaqachon ishlatilmoqda');

    const existingPhone = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (existingPhone) throw new ConflictException('Bu telefon raqam allaqachon ishlatilmoqda');

    // Split full name: first word = firstName, rest = lastName
    const parts = dto.fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') || firstName;

    // First user becomes ADMIN, rest become EMPLOYEE
    const userCount = await this.userRepo.count();
    const role = userCount === 0 ? UserRole.ADMIN : UserRole.EMPLOYEE;

    // Generate 6-digit code with 10-minute expiry
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      firstName,
      lastName,
      email: dto.email,
      phone: dto.phone,
      password: hashed,
      role,
      isVerified: false,
      verificationCode: code,
      verificationCodeExpiresAt: expiresAt,
    });
    await this.userRepo.save(user);

    // Send verification codes (console fallback in dev)
    await this.emailService.sendEmailCode(dto.email, code);
    await this.emailService.sendSmsCode(dto.phone, code);

    return {
      message: 'Tasdiqlash kodi yuborildi. Elektron pochta yoki telefoningizni tekshiring.',
      contact: dto.email,
    };
  }

  async verify(dto: VerifyDto) {
    const user = await this.findByEmailOrPhone(dto.emailOrPhone);
    if (!user) throw new UnauthorizedException("Foydalanuvchi topilmadi");

    if (user.isVerified) {
      const safeUser = this.stripSensitive(user);
      return { message: 'Hisob allaqachon tasdiqlangan', user: safeUser, token: this.sign(user) };
    }

    if (!user.verificationCode || user.verificationCode !== dto.code) {
      throw new BadRequestException("Kod noto'g'ri");
    }

    if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Kod muddati tugagan');
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await this.userRepo.save(user);

    const safeUser = this.stripSensitive(user);
    return {
      message: "Ro'yxatdan o'tish muvaffaqiyatli",
      user: safeUser,
      token: this.sign(user),
    };
  }

  async resendCode(dto: ResendCodeDto) {
    const user = await this.findByEmailOrPhone(dto.emailOrPhone);
    if (!user) throw new UnauthorizedException("Foydalanuvchi topilmadi");
    if (user.isVerified) throw new BadRequestException('Hisob allaqachon tasdiqlangan');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepo.save(user);

    await this.emailService.sendEmailCode(user.email, code);
    if (user.phone) await this.emailService.sendSmsCode(user.phone, code);

    return { message: 'Yangi tasdiqlash kodi yuborildi' };
  }

  async login(dto: LoginDto) {
    const user = await this.findByEmailOrPhone(dto.emailOrPhone, true);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Elektron pochta/telefon yoki parol noto'g'ri");
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Avval tasdiqlash kodini kiriting');
    }

    const valid = await bcrypt.compare(dto.password, (user as any).password);
    if (!valid) throw new UnauthorizedException("Elektron pochta/telefon yoki parol noto'g'ri");

    const safeUser = this.stripSensitive(user);
    return { message: 'Kirish muvaffaqiyatli', user: safeUser, token: this.sign(user) };
  }

  private async findByEmailOrPhone(emailOrPhone: string, withPassword = false): Promise<User | null> {
    const select: FindOptionsSelect<User> = {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isVerified: true,
      verificationCode: true,
      verificationCodeExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    };
    if (withPassword) (select as Record<string, boolean>).password = true;

    const isEmail = emailOrPhone.includes('@');
    const where = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };
    return this.userRepo.findOne({ where, select });
  }

  private stripSensitive(user: User): Partial<User> {
    const { verificationCode: _vc, verificationCodeExpiresAt: _exp, ...safe } = user as any;
    void _vc; void _exp;
    return safe;
  }

  private sign(user: User) {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
