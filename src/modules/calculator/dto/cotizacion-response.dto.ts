import { ApiProperty } from '@nestjs/swagger';

export class PreciosModosDto {
  @ApiProperty({
    description: 'Precio Sucursal a Sucursal',
    example: 14230.43,
  })
  SUC_SUC: number;

  @ApiProperty({
    description: 'Precio Sucursal a Domicilio',
    example: 19376.53,
  })
  SUC_DOM: number;

  @ApiProperty({
    description: 'Precio Domicilio a Sucursal',
    example: 19376.53,
  })
  DOM_SUC: number;

  @ApiProperty({
    description: 'Precio Domicilio a Domicilio',
    example: 24522.63,
  })
  DOM_DOM: number;
}

export class CotizacionResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({
    type: 'object',
    properties: {
      precios: {
        type: () => PreciosModosDto,
      },
    },
  })
  data: {
    precios: PreciosModosDto;
  };
}

