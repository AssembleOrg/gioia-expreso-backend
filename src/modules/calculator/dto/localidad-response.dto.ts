import { ApiProperty } from '@nestjs/swagger';

export class ProvinciaDto {
  @ApiProperty({ example: 0 })
  id: number;

  @ApiProperty({ example: '' })
  provincia: string;

  @ApiProperty({ example: 0 })
  codigoafip: number;

  @ApiProperty({ example: '' })
  codigo: string;
}

export class LocalidadDto {
  @ApiProperty({ example: 437 })
  id: number;

  @ApiProperty({ example: '06441030015' })
  localidad_id: string;

  @ApiProperty({ example: 'LA PLATA' })
  localidad: string;

  @ApiProperty({ example: 1 })
  provincia_id: number;

  @ApiProperty({ example: 'BUENOS AIRES' })
  provincia_nombre: string;

  @ApiProperty({ example: '-34.920863104693' })
  centroide_lat: string;

  @ApiProperty({ example: '-57.9540560062469' })
  centroide_lon: string;

  @ApiProperty({ example: '1900' })
  cp: string;

  @ApiProperty({ example: false })
  mapa: boolean;

  @ApiProperty({ example: 0 })
  zoom: number;

  @ApiProperty({ type: ProvinciaDto })
  provincia: ProvinciaDto;
}

export class LocalidadesResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({
    type: 'object',
    properties: {
      localidades: {
        type: 'array',
        items: { $ref: '#/components/schemas/LocalidadDto' },
      },
    },
  })
  data: {
    localidades: LocalidadDto[];
  };
}

