import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '@common/decorators';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/enums';
import { GenerateQrDto, QrContentType } from '../dto';
import { QrService } from '../services';

@ApiTags('QR')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generate')
  @Public()
  @ApiOperation({
    summary: 'Generar código QR',
    description: 'Genera un código QR a partir de texto, URL o JSON. Retorna imagen base64.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Código QR generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        qr: {
          type: 'string',
          description: 'Imagen QR en formato base64 data URL',
          example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
        },
        content: {
          type: 'string',
          description: 'Contenido codificado en el QR',
        },
        type: {
          type: 'string',
          enum: ['text', 'url', 'json'],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  async generateQr(@Body() dto: GenerateQrDto) {
    const qrBase64 = await this.qrService.generateQrBase64(dto);
    
    return {
      qr: qrBase64,
      content: dto.type === QrContentType.JSON 
        ? JSON.stringify(dto.jsonData) 
        : dto.content,
      type: dto.type || QrContentType.TEXT,
    };
  }

  @Post('generate/image')
  @Public()
  @ApiOperation({
    summary: 'Generar código QR como imagen PNG',
    description: 'Genera un código QR y lo retorna directamente como imagen PNG.',
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
  async generateQrImage(@Body() dto: GenerateQrDto, @Res() res: Response) {
    const buffer = await this.qrService.generateQrBuffer(dto);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Content-Disposition': 'inline; filename="qr-code.png"',
    });
    res.end(buffer);
  }

  @Post('generate/svg')
  @Public()
  @ApiOperation({
    summary: 'Generar código QR como SVG',
    description: 'Genera un código QR en formato SVG.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Código QR en formato SVG',
    schema: {
      type: 'object',
      properties: {
        svg: {
          type: 'string',
          description: 'Código SVG del QR',
        },
      },
    },
  })
  async generateQrSvg(@Body() dto: GenerateQrDto) {
    const svg = await this.qrService.generateQrSvg(dto);
    
    return {
      svg,
      content: dto.type === QrContentType.JSON 
        ? JSON.stringify(dto.jsonData) 
        : dto.content,
      type: dto.type || QrContentType.TEXT,
    };
  }

  @Get('generate/quick')
  @Public()
  @ApiOperation({
    summary: 'Generar QR rápido desde URL',
    description: 'Genera un código QR directamente desde parámetros de query. Útil para generar QRs rápidos.',
  })
  @ApiQuery({
    name: 'content',
    description: 'Contenido a codificar',
    required: true,
    example: 'https://ejemplo.com',
  })
  @ApiQuery({
    name: 'type',
    description: 'Tipo de contenido',
    required: false,
    enum: QrContentType,
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
  async generateQuickQr(
    @Query('content') content: string,
    @Query('type') type: QrContentType = QrContentType.TEXT,
    @Res() res: Response,
  ) {
    const dto: GenerateQrDto = { content, type };
    const buffer = await this.qrService.generateQrBuffer(dto);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(buffer);
  }
}


