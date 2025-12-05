import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import * as QRCode from 'qrcode';
import {
  CreateInvoiceDto,
  UltimoAutorizadoDto,
  AfipCredentialsDto,
  ConsultarContribuyenteDto,
  CondicionesIvaDto,
  GenerarQrAfipDto,
} from '../dto';

// Interfaces para respuestas
interface QrData {
  ver: number;
  fecha: string;
  cuit: string;
  ptoVta: number;
  tipoCmp: number;
  nroCmp: number;
  importe: number;
  moneda: string;
  ctz: number;
  tipoDocRec: number;
  nroDocRec: string;
  tipoCodAut: string;
  codAut: string;
  url: string;
}

interface InvoiceResult {
  cae: string;
  caeFchVto: string;
  puntoVenta: number;
  tipoComprobante: number;
  numeroComprobante: number;
  fechaComprobante: string;
  importeTotal: number;
  resultado: string;
  codigoAutorizacion: string;
  cuitEmisor: string;
  tipoDocReceptor: number;
  nroDocReceptor: string;
  qrData?: QrData;
}

@Injectable()
export class AfipService {
  private readonly logger = new Logger(AfipService.name);
  private readonly apiUrl: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('afip.apiUrl') || 'https://api.afip.gob.ar';
    this.isProduction = this.configService.get<boolean>('afip.production') || false;
  }

  /**
   * Realiza una petición HTTP a la API de AFIP
   */
  private async makeRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any,
    retryCount = 0,
  ): Promise<any> {
    try {
      const url = `${this.apiUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      this.logger.debug(`${method} ${url}`);

      const response = await firstValueFrom(
        method === 'GET'
          ? this.httpService.get(url, { headers })
          : this.httpService.post(url, body, { headers }),
      );

      // Extraer solo el data de la respuesta
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        return response.data.data;
      }

      return response.data;
    } catch (error: any) {
      const axiosError = error as AxiosError;

      // Si recibimos 401 y aún no hemos reintentado, reintentar
      if (axiosError.response?.status === 401 && retryCount === 0) {
        this.logger.warn('Error de autenticación, reintentando...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.makeRequest(method, endpoint, body, retryCount + 1);
      }

      // Si es un error HTTP, lanzar excepción con el mensaje apropiado
      if (axiosError.response) {
        const status = axiosError.response.status;
        const statusText = axiosError.response.statusText;
        const data = axiosError.response.data as any;

        this.logger.error(`Error ${status} en ${method} ${endpoint}: ${JSON.stringify(data)}`);

        const errorMessage = (data && typeof data === 'object' && 'message' in data)
          ? data.message
          : `Error al comunicarse con API de AFIP: ${statusText}`;

        throw new HttpException(errorMessage, status);
      }

      // Error de red u otro error
      this.logger.error(`Error de red en ${method} ${endpoint}: ${error.message}`, error.stack);
      throw new HttpException(
        'Error al comunicarse con la API de AFIP',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crear factura electrónica
   */
  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceResult> {
    this.logger.log(`Creando factura tipo ${dto.tipoComprobante} para CUIT ${dto.cuitEmisor}`);

    const result = await this.makeRequest('POST', '/api/afip/invoice', dto);

    // Si la respuesta incluye los datos necesarios, generar QR
    if (result.cae && result.numeroComprobante) {
      const qrData = await this.generateQrData({
        cuit: dto.cuitEmisor,
        ptoVta: dto.puntoVenta,
        tipoCmp: dto.tipoComprobante,
        nroCmp: result.numeroComprobante,
        fecha: dto.fechaComprobante,
        importe: dto.importeTotal,
        moneda: dto.monedaId || 'PES',
        ctz: dto.cotizacionMoneda || 1,
        tipoDocRec: dto.tipoDocumento,
        nroDocRec: dto.cuitCliente,
        cae: result.cae,
      });

      result.qrData = qrData;
    }

    this.logger.log(`Factura creada exitosamente. CAE: ${result.cae}`);
    return result;
  }

  /**
   * Consultar último comprobante autorizado
   */
  async getUltimoAutorizado(dto: UltimoAutorizadoDto): Promise<{ ultimoAutorizado: number; proximoNumero: number }> {
    this.logger.log(`Consultando último autorizado PV ${dto.puntoVenta} Tipo ${dto.tipoComprobante}`);
    return this.makeRequest('POST', '/api/afip/ultimo-autorizado', dto);
  }

  /**
   * Consultar datos de contribuyente
   */
  async consultarContribuyente(dto: ConsultarContribuyenteDto): Promise<{
    cuit: string;
    denominacion: string;
    condicionIva: string;
    domicilioFiscal: string;
    activo: boolean;
  }> {
    this.logger.log(`Consultando contribuyente CUIT ${dto.cuitConsultar}`);
    return this.makeRequest('POST', '/api/afip/consultar-contribuyente', dto);
  }

  /**
   * Listar tipos de comprobante habilitados
   */
  async getTiposComprobante(dto: AfipCredentialsDto): Promise<Array<{
    codigo: number;
    descripcion: string;
    clase: string;
  }>> {
    this.logger.log(`Obteniendo tipos de comprobante para CUIT ${dto.cuitEmisor}`);
    return this.makeRequest('POST', '/api/afip/tipos-comprobante', dto);
  }

  /**
   * Listar puntos de venta
   */
  async getPuntosVenta(dto: AfipCredentialsDto): Promise<Array<{
    numero: number;
    tipo: string;
    bloqueado: boolean;
    fechaBaja: string | null;
  }>> {
    this.logger.log(`Obteniendo puntos de venta para CUIT ${dto.cuitEmisor}`);
    return this.makeRequest('POST', '/api/afip/puntos-venta', dto);
  }

  /**
   * Listar condiciones IVA válidas
   */
  async getCondicionesIva(dto: CondicionesIvaDto): Promise<Array<{
    codigo: number;
    descripcion: string;
    validoParaClaseA: boolean;
    validoParaClaseB: boolean;
    validoParaClaseC: boolean;
    validoParaClaseM: boolean;
  }>> {
    this.logger.log(`Obteniendo condiciones IVA${dto.claseComprobante ? ` para clase ${dto.claseComprobante}` : ''}`);
    return this.makeRequest('POST', '/api/afip/condiciones-iva', dto);
  }

  /**
   * Generar datos para código QR de AFIP
   */
  async generateQrData(dto: GenerarQrAfipDto): Promise<QrData> {
    // Formatear fecha de YYYYMMDD a YYYY-MM-DD
    const fechaFormateada = `${dto.fecha.substring(0, 4)}-${dto.fecha.substring(4, 6)}-${dto.fecha.substring(6, 8)}`;

    const qrPayload = {
      ver: 1,
      fecha: fechaFormateada,
      cuit: parseInt(dto.cuit, 10),
      ptoVta: dto.ptoVta,
      tipoCmp: dto.tipoCmp,
      nroCmp: dto.nroCmp,
      importe: dto.importe,
      moneda: dto.moneda || 'PES',
      ctz: dto.ctz || 1,
      tipoDocRec: dto.tipoDocRec,
      nroDocRec: dto.nroDocRec === '0' ? 0 : parseInt(dto.nroDocRec, 10),
      tipoCodAut: 'E', // E = CAE
      codAut: parseInt(dto.cae, 10),
    };

    const base64Payload = Buffer.from(JSON.stringify(qrPayload)).toString('base64');
    const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64Payload}`;

    return {
      ver: 1,
      fecha: fechaFormateada,
      cuit: dto.cuit,
      ptoVta: dto.ptoVta,
      tipoCmp: dto.tipoCmp,
      nroCmp: dto.nroCmp,
      importe: dto.importe,
      moneda: dto.moneda || 'PES',
      ctz: dto.ctz || 1,
      tipoDocRec: dto.tipoDocRec,
      nroDocRec: dto.nroDocRec,
      tipoCodAut: 'E',
      codAut: dto.cae,
      url: qrUrl,
    };
  }

  /**
   * Generar imagen QR para factura AFIP
   */
  async generateQrImage(dto: GenerarQrAfipDto): Promise<Buffer> {
    const qrData = await this.generateQrData(dto);
    
    return QRCode.toBuffer(qrData.url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      type: 'png',
    });
  }
}
