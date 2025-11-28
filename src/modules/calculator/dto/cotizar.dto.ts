import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { BultoDto } from './bulto.dto';

export class CotizarDto {
  @ApiProperty({
    description: 'ID del acuerdo (0 para cotización web)',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  acuerdos_id?: number = 0;

  @ApiProperty({
    description: 'ID del artículo (0 para bulto personalizado, o ID específico para paquetes predefinidos)',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  articulos_id?: number = 0;

  @ApiProperty({
    description: 'Código postal de origen',
    example: '1900',
    required: true,
  })
  @IsString()
  opostal: string;

  @ApiProperty({
    description: 'Código postal de destino',
    example: '3016',
    required: true,
  })
  @IsString()
  dpostal: string;

  @ApiProperty({
    description: 'Array de bultos a cotizar',
    type: [BultoDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BultoDto)
  bultos: BultoDto[];
}

