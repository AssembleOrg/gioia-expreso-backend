import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CotizacionItemDto {
  @ApiProperty({
    description: 'ID de la filial de origen',
    example: 67,
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ofiliales_id: number;

  @ApiProperty({
    description: 'ID de la filial de destino',
    example: 196,
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dfiliales_id: number;

  @ApiProperty({
    description: 'ID de la localidad',
    example: 22258,
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  localidades_id: number;

  @ApiProperty({
    description: 'ID del artículo',
    example: 119,
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  articulos_id: number;

  @ApiProperty({
    description: 'ID del precio',
    example: 1,
    required: true,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precios_id: number;

  @ApiProperty({
    description: 'Peso en kilogramos',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  peso?: number = 0;

  @ApiProperty({
    description: 'Dimensión X (largo) en centímetros',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  x?: number = 0;

  @ApiProperty({
    description: 'Dimensión Y (ancho) en centímetros',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  y?: number = 0;

  @ApiProperty({
    description: 'Dimensión Z (alto) en centímetros',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  z?: number = 0;

  @ApiProperty({
    description: 'Volumen en centímetros cúbicos',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  volumen?: number = 0;

  @ApiProperty({
    description: 'Cantidad de bultos',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cantidad?: number = 0;

  @ApiProperty({
    description: 'Valor declarado del envío',
    example: 5000,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_declarado: number;

  @ApiProperty({
    description: 'ID del remitente',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  remitentes_id?: number = 0;
}
