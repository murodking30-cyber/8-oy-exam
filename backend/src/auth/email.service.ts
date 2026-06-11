import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendEmailCode(to: string, code: string): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.log(`📧 [DEV] Email: ${to} | Tasdiqlash kodi: ${code}`);
      return;
    }

    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Qurilish CRM <onboarding@resend.dev>',
        to: [to],
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
            </div>
          </div>
        `,
      });
      this.logger.log(`📧 Kod ${to} ga yuborildi`);
    } catch (err) {
      this.logger.error(`📧 Xatolik: ${(err as Error).message}`);
      this.logger.log(`📧 [FALLBACK] Email: ${to} | Tasdiqlash kodi: ${code}`);
    }
  }

  async sendSmsCode(phone: string, code: string): Promise<void> {
    this.logger.warn('📱 [DEV] SMS sozlanmagan — kod consolega chiqarilmoqda');
    this.logger.log(`📱 [DEV] Telefon: ${phone} | Tasdiqlash kodi: ${code}`);
  }
}
