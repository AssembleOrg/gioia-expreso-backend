import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum QrContentType {
  TEXT = 'text',
  URL = 'url',
  JSON = 'json',
}

export class GenerateQrDto {
  @ApiProperty({
    description: 'Contenido a codificar en el QR',
    example: 'https://ejemplo.com',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Tipo de contenido',
    enum: QrContentType,
    default: QrContentType.TEXT,
    example: QrContentType.URL,
  })
  @IsOptional()
  @IsEnum(QrContentType, {
    message: 'El tipo de contenido debe ser: text, url o json',
  })
  type?: QrContentType = QrContentType.TEXT;

  @ApiPropertyOptional({
    description: 'Datos JSON a codificar (solo si type es json)',
    example: { id: 1, nombre: 'Producto' },
  })
  @IsOptional()
  @IsObject({ message: 'Los datos JSON deben ser un objeto válido' })
  jsonData?: Record<string, any>;
}


