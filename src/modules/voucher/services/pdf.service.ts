import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
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

/** Sin PDFs por este tiempo, se cierra Chrome y se libera su memoria. */
const CHROME_OCIOSO_MS = 5 * 60_000;
const TIMEOUT_MS = 30_000;
const FUENTE_MS = 10_000;

const CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--no-zygote',
  '--font-render-hinting=none',
];

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private templateCompiled: Handlebars.TemplateDelegate | null = null;
  private logoBase64: string | null = null;

  /**
   * Un solo Chrome para toda la app (antes se abría uno completo, ~150-300 MB,
   * por cada PDF y sin límite de simultáneos: unas cuantas descargas a la vez
   * podían pasar el límite de memoria del contenedor).
   */
  private browser: Promise<puppeteer.Browser> | null = null;
  private ocioso: NodeJS.Timeout | null = null;
  /** Los PDFs se generan de a uno: cada uno espera al anterior. */
  private cola: Promise<unknown> = Promise.resolve();

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
        // Versión de 400 px: el original mide 17762×16596 (≈1,2 GB al
        // decodificarlo) y Chrome lo procesaba en cada PDF para mostrarlo a
        // 100 px. Queda como respaldo si falta la liviana.
        path.join(process.cwd(), 'public', 'logo-comprobante.png'),
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

    const turno = this.cola.then(() => this.renderizar(html));
    // La cola sigue aunque este PDF falle.
    this.cola = turno.catch(() => undefined);
    return turno;
  }

  private async renderizar(html: string): Promise<Buffer> {
    if (this.ocioso) clearTimeout(this.ocioso);
    const browser = await this.obtenerBrowser();
    const page = await browser.newPage();
    try {
      page.setDefaultTimeout(TIMEOUT_MS);
      // La plantilla carga Roboto de Google Fonts. Se espera el 'load' (no
      // hace falta que la red quede quieta), pero si la fuente tarda más de
      // FUENTE_MS el comprobante sale igual con la fuente de respaldo: mejor
      // eso que un error. Con el Chrome compartido la fuente queda en caché.
      try {
        await page.setContent(html, { waitUntil: 'load', timeout: FUENTE_MS });
      } catch (error) {
        if (!(error instanceof puppeteer.TimeoutError)) throw error;
        this.logger.warn('La fuente del comprobante tardó; se genera con la de respaldo.');
      }
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        timeout: TIMEOUT_MS,
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await page.close().catch(() => undefined);
      this.ocioso = setTimeout(() => void this.cerrarBrowser(), CHROME_OCIOSO_MS);
    }
  }

  private obtenerBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      const lanzado = puppeteer.launch({ headless: true, args: CHROME_ARGS });
      this.browser = lanzado;
      lanzado
        .then((b) =>
          // Si Chrome se cae, el próximo PDF lanza otro.
          b.on('disconnected', () => {
            if (this.browser === lanzado) this.browser = null;
          }),
        )
        .catch((error) => {
          this.logger.error('No se pudo iniciar Chrome para los PDFs:', error);
          if (this.browser === lanzado) this.browser = null;
        });
    }
    return this.browser;
  }

  private async cerrarBrowser(): Promise<void> {
    const actual = this.browser;
    this.browser = null;
    if (this.ocioso) clearTimeout(this.ocioso);
    this.ocioso = null;
    if (!actual) return;
    try {
      await (await actual).close();
    } catch {
      // Ya estaba cerrado o no llegó a abrir.
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.cerrarBrowser();
  }

  async savePdf(buffer: Buffer, filename: string): Promise<string> {
    const vouchersDir = path.join(process.cwd(), 'public', 'vouchers');
    
    // Ensure directory exists
    if (!fs.existsSync(vouchersDir)) {
      fs.mkdirSync(vouchersDir, { recursive: true });
    }

    const filePath = path.join(vouchersDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    
    return `/public/vouchers/${filename}`;
  }
}

