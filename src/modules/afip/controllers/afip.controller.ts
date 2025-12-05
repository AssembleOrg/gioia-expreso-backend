import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '@common/decorators';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums';
import {
  CreateInvoiceDto,
  UltimoAutorizadoDto,
  AfipCredentialsDto,
  ConsultarContribuyenteDto,
  CondicionesIvaDto,
  GenerarQrAfipDto,
} from '../dto';
import { AfipService } from '../services';

@ApiTags('AFIP')
@Controller('afip')
export class AfipController {
  constructor(private readonly afipService: AfipService) {}

  @Post('invoice')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear comprobante electrónico',
    description: 'Crea una factura, nota de crédito o nota de débito electrónica con AFIP.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comprobante creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        cae: { type: 'string', description: 'Código de Autorización Electrónico' },
        caeFchVto: { type: 'string', description: 'Fecha de vencimiento del CAE' },
        puntoVenta: { type: 'number' },
        tipoComprobante: { type: 'number' },
        numeroComprobante: { type: 'number' },
        fechaComprobante: { type: 'string' },
        importeTotal: { type: 'number' },
        resultado: { type: 'string', description: 'A=Aprobado, R=Rechazado' },
        qrData: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL del código QR de AFIP' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de factura inválidos',
  })
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.afipService.createInvoice(dto);
  }

  @Post('ultimo-autorizado')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar último comprobante autorizado',
    description: 'Obtiene el número del último comprobante autorizado para un punto de venta y tipo.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Último comprobante autorizado',
    schema: {
      type: 'object',
      properties: {
        ultimoAutorizado: { type: 'number', description: 'Último número autorizado' },
        proximoNumero: { type: 'number', description: 'Próximo número a utilizar' },
      },
    },
  })
  async getUltimoAutorizado(@Body() dto: UltimoAutorizadoDto) {
    return this.afipService.getUltimoAutorizado(dto);
  }

  @Post('consultar-contribuyente')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar datos de contribuyente',
    description: 'Obtiene información de un contribuyente a partir de su CUIT.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos del contribuyente',
    schema: {
      type: 'object',
      properties: {
        cuit: { type: 'string' },
        denominacion: { type: 'string' },
        condicionIva: { type: 'string' },
        domicilioFiscal: { type: 'string' },
        activo: { type: 'boolean' },
      },
    },
  })
  async consultarContribuyente(@Body() dto: ConsultarContribuyenteDto) {
    return this.afipService.consultarContribuyente(dto);
  }

  @Post('tipos-comprobante')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar tipos de comprobante',
    description: 'Obtiene los tipos de comprobante habilitados para el emisor.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de comprobante',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          codigo: { type: 'number' },
          descripcion: { type: 'string' },
          clase: { type: 'string' },
        },
      },
    },
  })
  async getTiposComprobante(@Body() dto: AfipCredentialsDto) {
    return this.afipService.getTiposComprobante(dto);
  }

  @Post('puntos-venta')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar puntos de venta',
    description: 'Obtiene los puntos de venta habilitados para el emisor.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de puntos de venta',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          numero: { type: 'number' },
          tipo: { type: 'string' },
          bloqueado: { type: 'boolean' },
          fechaBaja: { type: 'string', nullable: true },
        },
      },
    },
  })
  async getPuntosVenta(@Body() dto: AfipCredentialsDto) {
    return this.afipService.getPuntosVenta(dto);
  }

  @Post('condiciones-iva')
  @Roles(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar condiciones IVA',
    description: 'Obtiene las condiciones IVA válidas, opcionalmente filtradas por clase de comprobante.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de condiciones IVA',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          codigo: { type: 'number' },
          descripcion: { type: 'string' },
          validoParaClaseA: { type: 'boolean' },
          validoParaClaseB: { type: 'boolean' },
          validoParaClaseC: { type: 'boolean' },
          validoParaClaseM: { type: 'boolean' },
        },
      },
    },
  })
  async getCondicionesIva(@Body() dto: CondicionesIvaDto) {
    return this.afipService.getCondicionesIva(dto);
  }

  @Post('generar-qr')
  @Public()
  @ApiOperation({
    summary: 'Generar código QR de AFIP',
    description: 'Genera los datos y URL del código QR para un comprobante electrónico.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos del código QR',
    schema: {
      type: 'object',
      properties: {
        ver: { type: 'number', example: 1 },
        fecha: { type: 'string', example: '2025-12-05' },
        cuit: { type: 'string' },
        ptoVta: { type: 'number' },
        tipoCmp: { type: 'number' },
        nroCmp: { type: 'number' },
        importe: { type: 'number' },
        moneda: { type: 'string' },
        ctz: { type: 'number' },
        tipoDocRec: { type: 'number' },
        nroDocRec: { type: 'string' },
        tipoCodAut: { type: 'string' },
        codAut: { type: 'string' },
        url: { type: 'string', description: 'URL del QR de AFIP' },
      },
    },
  })
  async generateQr(@Body() dto: GenerarQrAfipDto) {
    return this.afipService.generateQrData(dto);
  }

  @Post('generar-qr/image')
  @Public()
  @ApiOperation({
    summary: 'Generar imagen QR de AFIP',
    description: 'Genera la imagen PNG del código QR para un comprobante electrónico.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Imagen PNG del código QR',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async generateQrImage(@Body() dto: GenerarQrAfipDto, @Res() res: Response) {
    const buffer = await this.afipService.generateQrImage(dto);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Content-Disposition': 'inline; filename="qr-afip.png"',
    });
    res.end(buffer);
  }
}

