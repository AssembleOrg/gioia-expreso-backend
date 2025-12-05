import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface VoucherData {
  voucherNumber: string;
  date: string;
  status: string;
  statusClass: string;
  client: {
    fullname: string;
    phone: string;
    email: string;
    cuit?: string | null;
    address: string;
  };
  origin: string;
  originPostal: string;
  destination: string;
  destinationPostal: string;
  packages: Array<{
    name: string;
    isCustom: boolean;
    height?: number | null;
    width?: number | null;
    depth?: number | null;
    quantity: number;
    weight: number;
    declaredValue: number | string;
  }>;
  totalPackages: number;
  totalWeight: string;
  totalDeclaredValue: string;
  price: string;
  notes?: string | null;
  generatedAt: string;
  logoBase64?: string;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private templateCompiled: Handlebars.TemplateDelegate | null = null;
  private logoBase64: string | null = null;

  constructor() {
    this.loadTemplate();
    this.loadLogo();
  }

  private loadTemplate() {
    try {
      // Try multiple paths for the template
      const possiblePaths = [
        path.join(__dirname, '..', 'templates', 'voucher.hbs'),
        path.join(process.cwd(), 'src', 'modules', 'voucher', 'templates', 'voucher.hbs'),
        path.join(process.cwd(), 'dist', 'modules', 'voucher', 'templates', 'voucher.hbs'),
      ];

      let templateSource: string | null = null;
      
      for (const templatePath of possiblePaths) {
        if (fs.existsSync(templatePath)) {
          templateSource = fs.readFileSync(templatePath, 'utf-8');
          this.logger.log(`Template loaded from: ${templatePath}`);
          break;
        }
      }

      if (!templateSource) {
        this.logger.error('Template file not found in any expected location');
        throw new Error('Template voucher.hbs not found');
      }

      this.templateCompiled = Handlebars.compile(templateSource);
    } catch (error) {
      this.logger.error(`Error loading template: ${error}`);
      throw error;
    }
  }

  private loadLogo() {
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'Logo Gioia e hijos srl V2.png'),
        path.join(process.cwd(), 'public', 'logo.png'),
      ];

      for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          this.logoBase64 = logoBuffer.toString('base64');
          this.logger.log(`Logo loaded from: ${logoPath}`);
          return;
        }
      }

      this.logger.warn('Logo file not found');
    } catch (error) {
      this.logger.error(`Error loading logo: ${error}`);
    }
  }

  async generateVoucherPdf(data: VoucherData): Promise<Buffer> {
    if (!this.templateCompiled) {
      this.loadTemplate();
    }

    // Add logo to data
    const templateData = {
      ...data,
      logoBase64: this.logoBase64,
    };

    // Render HTML from template
    const html = this.templateCompiled!(templateData);

    let browser: puppeteer.Browser | null = null;

    try {
      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      });

      const page = await browser.newPage();

      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async savePdf(buffer: Buffer, filename: string): Promise<string> {
    const vouchersDir = path.join(process.cwd(), 'public', 'vouchers');
    
    // Ensure directory exists
    if (!fs.existsSync(vouchersDir)) {
      fs.mkdirSync(vouchersDir, { recursive: true });
    }

    const filePath = path.join(vouchersDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    return `/public/vouchers/${filename}`;
  }
}

