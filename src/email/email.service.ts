import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '@rabbitmq';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;
  private readonly logoBase64: string;

  constructor(
    private rabbitMQService: RabbitMQService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('frontend.url') || process.env.FRONTEND_URL || 'http://localhost:3000';
    this.logoBase64 = this.loadLogo();
  }

  private loadLogo(): string {
    try {
      const logoPath = join(process.cwd(), 'public', 'gioia.jpeg');
      if (existsSync(logoPath)) {
        const logoBuffer = readFileSync(logoPath);
        return logoBuffer.toString('base64');
      }
    } catch (error) {
      this.logger.warn('No se pudo cargar el logo:', error);
    }
    return '';
  }

  async sendEmailVerification(email: string, fullname: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.frontendUrl}/api/auth/verify-email?token=${token}`;
    
    const htmlContent = this.getEmailVerificationHTML(fullname, verificationUrl);
    const textContent = this.getEmailVerificationText(fullname, verificationUrl);

    const emailData = {
      to: [{ email }],
      subject: 'Confirma tu correo electrónico - Transporte Gioia',
      htmlContent,
      textContent,
    };

    return this.rabbitMQService.sendMessage('send-email', emailData);
  }

  private getEmailVerificationHTML(fullname: string, verificationUrl: string): string {
    const logoImg = this.logoBase64 
      ? `<img src="data:image/jpeg;base64,${this.logoBase64}" alt="" style="max-width: 220px; height: auto; display: block; margin: 0 auto 25px;" />`
      : '';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu correo electrónico</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #000000;
      padding: 50px 30px;
      text-align: center;
    }
    .logo-container {
      margin-bottom: 25px;
    }
    .company-name {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin: 20px 0 10px 0;
      font-style: italic;
    }
    .company-subtitle {
      color: #00ced1;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      font-weight: 600;
      font-style: italic;
    }
    .content {
      padding: 50px 40px;
      color: #333333;
    }
    .greeting {
      font-size: 26px;
      color: #000000;
      margin-bottom: 25px;
      font-weight: 700;
    }
    .message {
      font-size: 15px;
      color: #555555;
      margin-bottom: 35px;
      line-height: 1.8;
    }
    .message p {
      margin-bottom: 15px;
    }
    .message strong {
      color: #000000;
      font-weight: 700;
    }
    .button-wrapper {
      text-align: center;
      margin: 45px 0;
    }
    .button {
      display: inline-block;
      padding: 20px 50px;
      background-color: #00ced1;
      color: #000000 !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 700;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      box-shadow: 0 4px 12px rgba(0, 206, 209, 0.3);
    }
    .link-section {
      margin-top: 35px;
      padding: 22px;
      background-color: #f0f9fa;
      border-left: 5px solid #00ced1;
      border-radius: 4px;
    }
    .link-section p {
      font-size: 13px;
      color: #666666;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .link-section a {
      color: #000000;
      word-break: break-all;
      font-size: 12px;
      text-decoration: none;
      border-bottom: 1px solid #00ced1;
    }
    .link-section a:hover {
      color: #00ced1;
    }
    .warning-box {
      margin-top: 35px;
      padding: 20px;
      background-color: #fff3cd;
      border-left: 5px solid #ffc107;
      border-radius: 4px;
    }
    .warning-box p {
      font-size: 13px;
      color: #856404;
      margin: 0;
      line-height: 1.6;
    }
    .warning-box strong {
      color: #664d03;
    }
    .footer {
      background-color: #000000;
      padding: 35px;
      text-align: center;
    }
    .footer p {
      font-size: 13px;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .footer-brand {
      margin-top: 20px;
    }
    .footer-brand-name {
      font-weight: 700;
      color: #ffffff;
      font-size: 17px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-style: italic;
    }
    .footer-brand-subtitle {
      color: #00ced1;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      font-style: italic;
      margin-top: 5px;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 25px;
      }
      .header {
        padding: 35px 20px;
      }
      .button {
        padding: 18px 40px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo-container">
        ${logoImg}
      </div>
      <div class="company-name">TRANSPORTE</div>
      <div class="company-subtitle">GIOIA E HIJOS SRL</div>
    </div>
    
    <div class="content">
      <div class="greeting">¡Hola ${fullname}!</div>
      
      <div class="message">
        <p>Gracias por registrarte en <strong>Transporte Gioia</strong>. Para completar tu registro y comenzar a utilizar nuestros servicios, necesitamos confirmar tu dirección de correo electrónico.</p>
        
        <p>Por favor, haz clic en el botón siguiente para verificar tu cuenta:</p>
      </div>
      
      <div class="button-wrapper">
        <a href="${verificationUrl}" class="button">Confirmar correo electrónico</a>
      </div>
      
      <div class="link-section">
        <p><strong>Si el botón no funciona</strong>, copia y pega el siguiente enlace en tu navegador:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </div>
      
      <div class="warning-box">
        <p><strong>⚠️ Importante:</strong> Este enlace expirará en 24 horas. Si no confirmas tu correo en ese tiempo, deberás solicitar un nuevo enlace de verificación.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Si no creaste una cuenta con nosotros, puedes ignorar este correo de forma segura.</p>
      <div class="footer-brand">
        <div class="footer-brand-name">TRANSPORTE</div>
        <div class="footer-brand-subtitle">GIOIA E HIJOS SRL</div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private getEmailVerificationText(fullname: string, verificationUrl: string): string {
    return `
¡Hola ${fullname}!

Gracias por registrarte en Transporte Gioia. Para completar tu registro y comenzar a utilizar nuestros servicios, necesitamos confirmar tu dirección de correo electrónico.

Por favor, visita el siguiente enlace para verificar tu cuenta:

${verificationUrl}

⚠️ IMPORTANTE: Este enlace expirará en 24 horas. Si no confirmas tu correo en ese tiempo, deberás solicitar un nuevo enlace de verificación.

Si no creaste una cuenta con nosotros, puedes ignorar este correo de forma segura.

---
TRANSPORTE
GIOIA E HIJOS SRL
    `.trim();
  }
}
