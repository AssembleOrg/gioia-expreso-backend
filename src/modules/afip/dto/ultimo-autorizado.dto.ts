import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';
import { AfipCredentialsDto } from './afip-credentials.dto';

export class UltimoAutorizadoDto extends AfipCredentialsDto {
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
    description: 'Tipo de comprobante',
    example: 6,
  })
  @IsNumber({}, { message: 'El tipo de comprobante debe ser un número' })
  tipoComprobante: number;
}


