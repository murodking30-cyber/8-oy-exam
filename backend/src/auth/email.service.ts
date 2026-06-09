import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendEmailCode(to: string, code: string): Promise<void> {
    const emailUser = this.config.get<string>('EMAIL_USER');
    const emailPass = this.config.get<string>('EMAIL_PASS');

    if (!emailUser || !emailPass) {
      this.logger.warn('📧 [DEV] EMAIL sozlanmagan — kod consolega chiqarilmoqda');
      this.logger.log(`📧 [DEV] Email: ${to} | Tasdiqlash kodi: ${code}`);
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass },
      });

      await transporter.sendMail({
        from: `"Qurilish CRM" <${emailUser}>`,
        to,
        subject: 'Tasdiqlash kodi — Qurilish CRM',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden">
            <div style="background:#4f46e5;padding:28px 32px">
              <h2 style="color:#fff;margin:0;font-size:20px">Qurilish CRM</h2>
              <p style="color:#c7d2fe;margin:4px 0 0;font-size:13px">Tasdiqlash kodi</p>
            </div>
            <div style="padding:32px">
              <p style="color:#1e293b;font-size:15px;margin:0 0 20px">Salom! Hisobingizni tasdiqlash uchun quyidagi kodni kiriting:</p>
              <div style="background:#fff;border:2px solid #e0e7ff;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
                <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#4f46e5">${code}</span>
              </div>
              <p style="color:#64748b;font-size:13px;margin:0">Ushbu kod <strong>10 daqiqa</strong> davomida amal qiladi.</p>
              <p style="color:#94a3b8;font-size:12px;margin:16px 0 0">Agar siz ro'yxatdan o'tmagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.</p>
            </div>
          </div>
        `,
      });

      this.logger.log(`📧 Tasdiqlash kodi ${to} ga yuborildi`);
    } catch (err) {
      this.logger.error(`📧 Email yuborishda xatolik: ${(err as Error).message}`);
      this.logger.log(`📧 [FALLBACK] Email: ${to} | Tasdiqlash kodi: ${code}`);
    }
  }

  async sendSmsCode(phone: string, code: string): Promise<void> {
    this.logger.warn('📱 [DEV] SMS sozlanmagan — kod consolega chiqarilmoqda');
    this.logger.log(`📱 [DEV] Telefon: ${phone} | Tasdiqlash kodi: ${code}`);
  }
}
