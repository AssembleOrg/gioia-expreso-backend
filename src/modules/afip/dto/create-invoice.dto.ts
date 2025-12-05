import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AfipCredentialsDto } from './afip-credentials.dto';

export class IvaItemDto {
  @ApiProperty({
    description: 'ID de alícuota IVA (3=0%, 4=10.5%, 5=21%, 6=27%, 8=5%, 9=2.5%)',
    example: 5,
  })
  @IsNumber({}, { message: 'El ID de IVA debe ser un número' })
  Id: number;

  @ApiProperty({
    description: 'Base imponible',
    example: 1000.0,
  })
  @IsNumber({}, { message: 'La base imponible debe ser un número' })
  BaseImp: number;

  @ApiProperty({
    description: 'Importe del IVA',
    example: 210.0,
  })
  @IsNumber({}, { message: 'El importe de IVA debe ser un número' })
  Importe: number;
}

export class ComprobanteAsociadoDto {
  @ApiProperty({
    description: 'Tipo de comprobante asociado',
    example: 6,
  })
  @IsNumber({}, { message: 'El tipo de comprobante debe ser un número' })
  Tipo: number;

  @ApiProperty({
    description: 'Punto de venta del comprobante asociado',
    example: 1,
  })
  @IsNumber({}, { message: 'El punto de venta debe ser un número' })
  PtoVta: number;

  @ApiProperty({
    description: 'Número del comprobante asociado',
    example: 1,
  })
  @IsNumber({}, { message: 'El número de comprobante debe ser un número' })
  Nro: number;

  @ApiPropertyOptional({
    description: 'Fecha del comprobante asociado (YYYYMMDD)',
    example: '20251201',
  })
  @IsOptional()
  @IsString({ message: 'La fecha debe ser un string' })
  CbteFch?: string;
}

export class CbuDto {
  @ApiProperty({
    description: 'CBU de la cuenta',
    example: '0110599940000064179016',
  })
  @IsString({ message: 'El CBU debe ser un string' })
  Cbu: string;

  @ApiPropertyOptional({
    description: 'Alias del CBU',
    example: 'MI.ALIAS.CBU',
  })
  @IsOptional()
  @IsString({ message: 'El alias debe ser un string' })
  Alias?: string;
}

export class CreateInvoiceDto extends AfipCredentialsDto {
  @ApiProperty({
    description: 'Punto de venta',
    example: 1,
    minimum: 1,
    maximum: 99999,
  })
  @IsNumber({}, { message: 'El punto de venta debe ser un número' })
  @Min(1, { message: 'El punto de venta debe ser mayor a 0' })
  @Max(99999, { message: 'El punto de venta no puede superar 99999' })
  puntoVenta: number;

  @ApiProperty({
    description: 'Tipo de comprobante (1=FA, 6=FB, 11=FC, etc.)',
    example: 6,
  })
  @IsNumber({}, { message: 'El tipo de comprobante debe ser un número' })
  tipoComprobante: number;

  @ApiProperty({
    description: 'Fecha del comprobante (YYYYMMDD)',
    example: '20251205',
  })
  @IsString({ message: 'La fecha del comprobante debe ser un string' })
  @IsNotEmpty({ message: 'La fecha del comprobante es requerida' })
  fechaComprobante: string;

  @ApiProperty({
    description: 'CUIT del cliente (0 para consumidor final)',
    example: '30123456789',
  })
  @IsString({ message: 'El CUIT del cliente debe ser un string' })
  cuitCliente: string;

  @ApiProperty({
    description: 'Tipo de documento (80=CUIT, 86=CUIL, 96=DNI, 99=Sin identificar)',
    example: 80,
  })
  @IsNumber({}, { message: 'El tipo de documento debe ser un número' })
  tipoDocumento: number;

  @ApiProperty({
    description: 'Condición IVA del receptor (1=RI, 4=Exento, 5=CF, 6=Monotributo)',
    example: 5,
  })
  @IsNumber({}, { message: 'La condición IVA del receptor debe ser un número' })
  condicionIvaReceptor: number;

  @ApiProperty({
    description: 'Concepto (1=Productos, 2=Servicios, 3=Productos y Servicios)',
    example: 1,
  })
  @IsNumber({}, { message: 'El concepto debe ser un número' })
  @Min(1, { message: 'El concepto debe ser 1, 2 o 3' })
  @Max(3, { message: 'El concepto debe ser 1, 2 o 3' })
  concepto: number;

  @ApiProperty({
    description: 'Importe neto gravado',
    example: 1000.0,
  })
  @IsNumber({}, { message: 'El importe neto gravado debe ser un número' })
  importeNetoGravado: number;

  @ApiProperty({
    description: 'Importe de IVA',
    example: 210.0,
  })
  @IsNumber({}, { message: 'El importe IVA debe ser un número' })
  importeIva: number;

  @ApiProperty({
    description: 'Importe total',
    example: 1210.0,
  })
  @IsNumber({}, { message: 'El importe total debe ser un número' })
  importeTotal: number;

  @ApiPropertyOptional({
    description: 'Array de alícuotas IVA',
    type: [IvaItemDto],
  })
  @IsOptional()
  @IsArray({ message: 'El IVA debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => IvaItemDto)
  iva?: IvaItemDto[];

  @ApiPropertyOptional({
    description: 'ID de moneda (PES=Pesos)',
    example: 'PES',
    default: 'PES',
  })
  @IsOptional()
  @IsString({ message: 'El ID de moneda debe ser un string' })
  monedaId?: string = 'PES';

  @ApiPropertyOptional({
    description: 'Cotización de la moneda',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La cotización debe ser un número' })
  cotizacionMoneda?: number = 1;

  @ApiPropertyOptional({
    description: 'Fecha inicio servicio (YYYYMMDD) - Solo para concepto 2 o 3',
    example: '20251201',
  })
  @IsOptional()
  @IsString({ message: 'La fecha de inicio de servicio debe ser un string' })
  fechaServicioDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha fin servicio (YYYYMMDD) - Solo para concepto 2 o 3',
    example: '20251205',
  })
  @IsOptional()
  @IsString({ message: 'La fecha de fin de servicio debe ser un string' })
  fechaServicioHasta?: string;

  @ApiPropertyOptional({
    description: 'Fecha vencimiento pago (YYYYMMDD) - Solo para concepto 2 o 3',
    example: '20251215',
  })
  @IsOptional()
  @IsString({ message: 'La fecha de vencimiento de pago debe ser un string' })
  fechaVencimientoPago?: string;

  @ApiPropertyOptional({
    description: 'Comprobantes asociados - Requerido para NC/ND',
    type: [ComprobanteAsociadoDto],
  })
  @IsOptional()
  @IsArray({ message: 'Los comprobantes asociados deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => ComprobanteAsociadoDto)
  comprobantesAsociados?: ComprobanteAsociadoDto[];

  @ApiPropertyOptional({
    description: 'CBU para FCE MiPyME',
    type: CbuDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CbuDto)
  cbu?: CbuDto;

  @ApiPropertyOptional({
    description: 'Fecha vencimiento pago FCE (YYYYMMDD)',
    example: '20260105',
  })
  @IsOptional()
  @IsString({ message: 'La fecha de vencimiento FCE debe ser un string' })
  fceVtoPago?: string;

  @ApiPropertyOptional({
    description: 'Importe no gravado',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El importe no gravado debe ser un número' })
  importeNoGravado?: number = 0;

  @ApiPropertyOptional({
    description: 'Importe exento',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El importe exento debe ser un número' })
  importeExento?: number = 0;

  @ApiPropertyOptional({
    description: 'Importe tributos',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El importe de tributos debe ser un número' })
  importeTributos?: number = 0;
}

