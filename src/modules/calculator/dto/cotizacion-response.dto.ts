import { ApiProperty } from '@nestjs/swagger';

export class CotizacionItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Domicilio a Domicilio' })
  descripcion: string;

  @ApiProperty({ example: 31164.57 })
  precio: number;

  @ApiProperty({ example: 37709.13 })
  precio_final: number;

  @ApiProperty({ example: 28364.57 })
  flete: number;

  @ApiProperty({ example: 2800 })
  seguro: number;
}

export class CotizacionResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({
    type: 'object',
    properties: {
      cotizacion_web: {
        type: 'array',
        items: { $ref: '#/components/schemas/CotizacionItemDto' },
      },
    },
  })
  data: {
    cotizacion_web: CotizacionItemDto[];
  };
}

