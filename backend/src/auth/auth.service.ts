import {
  BadRequestException,
  ConflictException,
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

    const parts = dto.fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') || firstName;

    const userCount = await this.userRepo.count();
    const role = userCount === 0 ? UserRole.ADMIN : UserRole.EMPLOYEE;

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

    await this.emailService.sendEmailCode(dto.email, code);

    return {
      message: "Ro'yxatdan o'tdingiz! Emailga yuborilgan tasdiqlash kodini kiriting.",
      contact: dto.email,
    };
  }

  async registerWithGoogle(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
  }): Promise<{ user: Partial<User>; token: string }> {
    let user = await this.userRepo.findOne({ where: { email: googleUser.email } });

    if (!user) {
      const userCount = await this.userRepo.count();
      const role = userCount === 0 ? UserRole.ADMIN : UserRole.EMPLOYEE;
      user = this.userRepo.create({
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        email: googleUser.email,
        googleId: googleUser.googleId,
        isVerified: true,
        role,
      });
      await this.userRepo.save(user);
    } else if (!user.googleId) {
      user.googleId = googleUser.googleId;
      user.isVerified = true;
      await this.userRepo.save(user);
    }

    return { user: this.stripSensitive(user), token: this.sign(user) };
  }

  async verify(dto: VerifyDto) {
    const user = await this.findByEmailOrPhone(dto.emailOrPhone);
    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');

    if (user.isVerified) {
      return { message: 'Hisob allaqachon tasdiqlangan', user: this.stripSensitive(user), token: this.sign(user) };
    }

    if (!user.verificationCode || user.verificationCode !== dto.code) {
      throw new BadRequestException("Kod noto'g'ri");
    }

    if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Kod muddati tugagan. Yangi kod so\'rating.');
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await this.userRepo.save(user);

    return {
      message: "Hisob tasdiqlandi! Xush kelibsiz.",
      user: this.stripSensitive(user),
      token: this.sign(user),
    };
  }

  async resendCode(dto: ResendCodeDto) {
    const user = await this.findByEmailOrPhone(dto.emailOrPhone);
    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');
    if (user.isVerified) throw new BadRequestException('Hisob allaqachon tasdiqlangan');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepo.save(user);

    await this.emailService.sendEmailCode(user.email, code);

    return { message: 'Yangi tasdiqlash kodi yuborildi' };
  }

  async login(dto: LoginDto) {
    const user = await this.findByEmailOrPhone(dto.emailOrPhone, true);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Elektron pochta/telefon yoki parol noto'g'ri");
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Avval tasdiqlash kodini kiriting');
    }

    const valid = await bcrypt.compare(dto.password, (user as any).password);
    if (!valid) throw new UnauthorizedException("Elektron pochta/telefon yoki parol noto'g'ri");

    return { message: 'Kirish muvaffaqiyatli', user: this.stripSensitive(user), token: this.sign(user) };
  }

  private async findByEmailOrPhone(emailOrPhone: string, withPassword = false): Promise<User | null> {
    const select: FindOptionsSelect<User> = {
      id: true, email: true, phone: true, firstName: true, lastName: true,
      role: true, isActive: true, isVerified: true,
      verificationCode: true, verificationCodeExpiresAt: true,
      createdAt: true, updatedAt: true,
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
