import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerarQrAfipDto {
  @ApiProperty({
    description: 'CUIT del emisor',
    example: '20123456789',
  })
  @IsString({ message: 'El CUIT debe ser un string' })
  @IsNotEmpty({ message: 'El CUIT es requerido' })
  cuit: string;

  @ApiProperty({
    description: 'Punto de venta',
    example: 1,
  })
  @IsNumber({}, { message: 'El punto de venta debe ser un número' })
  ptoVta: number;

  @ApiProperty({
    description: 'Tipo de comprobante',
    example: 6,
  })
  @IsNumber({}, { message: 'El tipo de comprobante debe ser un número' })
  tipoCmp: number;

  @ApiProperty({
    description: 'Número de comprobante',
    example: 1,
  })
  @IsNumber({}, { message: 'El número de comprobante debe ser un número' })
  nroCmp: number;

  @ApiProperty({
    description: 'Fecha del comprobante (YYYYMMDD)',
    example: '20251205',
  })
  @IsString({ message: 'La fecha debe ser un string' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  fecha: string;

  @ApiProperty({
    description: 'Importe total',
    example: 1210.0,
  })
  @IsNumber({}, { message: 'El importe debe ser un número' })
  importe: number;

  @ApiPropertyOptional({
    description: 'ID de moneda',
    example: 'PES',
    default: 'PES',
  })
  @IsOptional()
  @IsString({ message: 'La moneda debe ser un string' })
  moneda?: string = 'PES';

  @ApiPropertyOptional({
    description: 'Cotización de la moneda',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La cotización debe ser un número' })
  ctz?: number = 1;

  @ApiProperty({
    description: 'Tipo de documento del receptor',
    example: 99,
  })
  @IsNumber({}, { message: 'El tipo de documento debe ser un número' })
  tipoDocRec: number;

  @ApiProperty({
    description: 'Número de documento del receptor',
    example: '0',
  })
  @IsString({ message: 'El número de documento debe ser un string' })
  nroDocRec: string;

  @ApiProperty({
    description: 'CAE del comprobante',
    example: '71234567890123',
  })
  @IsString({ message: 'El CAE debe ser un string' })
  @IsNotEmpty({ message: 'El CAE es requerido' })
  cae: string;
}

