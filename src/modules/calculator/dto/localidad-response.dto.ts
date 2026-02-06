import { ApiProperty } from '@nestjs/swagger';

export class LocalidadDto {
  @ApiProperty({ example: 3588 })
  id: number;

  @ApiProperty({ example: 20 })
  provincias_id: number;

  @ApiProperty({ example: '' })
  nombre: string;

  @ApiProperty({ example: '3000' })
  cp: string;

  @ApiProperty({ example: '-31.645164805431' })
  latitud: string;

  @ApiProperty({ example: '-60.7093147118987' })
  longitud: string;

  @ApiProperty({ example: '0001-01-01T00:00:00Z' })
  alta: string;

  @ApiProperty({ example: 0 })
  ualta: number;

  @ApiProperty({ example: null, nullable: true })
  baja: string | null;

  @ApiProperty({ example: null, nullable: true })
  ubaja: number | null;

  @ApiProperty({ example: 14 })
  cobertura: number;

  @ApiProperty({ example: 'SANTA FE' })
  localidad_nombre: string;

  @ApiProperty({ example: 'SANTA FE' })
  provincia_nombre: string;

  @ApiProperty({ example: 'SANTA FE' })
  filial_nombre: string;

  @ApiProperty({ example: 0 })
  filiales_id: number;

  @ApiProperty({ example: false })
  redespacho: boolean;

  @ApiProperty({ example: '1121' })
  codigo: string;
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

