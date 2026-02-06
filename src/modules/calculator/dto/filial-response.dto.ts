import { ApiProperty } from '@nestjs/swagger';

export class FilialPublicDto {
  @ApiProperty({ example: 15 })
  id: number;

  @ApiProperty({ example: 'MAR DEL PLATA' })
  nombre: string;

  @ApiProperty({ example: 'Gaboto N° 6650' })
  direccion: string;

  @ApiProperty({ example: '', required: false })
  telefono: string;

  @ApiProperty({ example: '', required: false })
  celular: string;

  @ApiProperty({ example: '', required: false })
  email: string;

  @ApiProperty({ example: '-38.0193471' })
  latitud: string;

  @ApiProperty({ example: '-57.5739221' })
  longitud: string;
}

export class FilialResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({
    type: 'object',
    properties: {
      filial_public: {
        type: () => FilialPublicDto,
      },
    },
  })
  data: {
    filial_public: FilialPublicDto;
  };
}
