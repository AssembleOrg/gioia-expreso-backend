import { Injectable, BadRequestException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { GenerateQrDto, QrContentType } from '../dto';

@Injectable()
export class QrService {
  /**
   * Genera un código QR como imagen base64
   */
  async generateQrBase64(dto: GenerateQrDto): Promise<string> {
    const content = this.prepareContent(dto);
    
    try {
      const qrDataUrl = await QRCode.toDataURL(content, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      return qrDataUrl;
    } catch (error) {
      throw new BadRequestException('Error al generar el código QR');
    }
  }

  /**
   * Genera un código QR como buffer PNG
   */
  async generateQrBuffer(dto: GenerateQrDto): Promise<Buffer> {
    const content = this.prepareContent(dto);
    
    try {
      const buffer = await QRCode.toBuffer(content, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
        type: 'png',
      });
      
      return buffer;
    } catch (error) {
      throw new BadRequestException('Error al generar el código QR');
    }
  }

  /**
   * Genera un código QR como SVG string
   */
  async generateQrSvg(dto: GenerateQrDto): Promise<string> {
    const content = this.prepareContent(dto);
    
    try {
      const svg = await QRCode.toString(content, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
      });
      
      return svg;
    } catch (error) {
      throw new BadRequestException('Error al generar el código QR');
    }
  }

  /**
   * Prepara el contenido según el tipo
   */
  private prepareContent(dto: GenerateQrDto): string {
    switch (dto.type) {
      case QrContentType.JSON:
        if (!dto.jsonData) {
          throw new BadRequestException('Se requiere jsonData cuando el tipo es json');
        }
        return JSON.stringify(dto.jsonData);
      
      case QrContentType.URL:
        if (!this.isValidUrl(dto.content)) {
          throw new BadRequestException('El contenido no es una URL válida');
        }
        return dto.content;
      
      case QrContentType.TEXT:
      default:
        return dto.content;
    }
  }

  /**
   * Valida si un string es una URL válida
   */
  private isValidUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }
}


