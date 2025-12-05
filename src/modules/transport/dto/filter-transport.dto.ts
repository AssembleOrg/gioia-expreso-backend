import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterTransportDto {
  @ApiPropertyOptional({
    description: 'Filtrar por nombre (búsqueda parcial)',
    example: 'Ford',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por patente (búsqueda parcial)',
    example: 'AB',
  })
  @IsOptional()
  @IsString({ message: 'La patente debe ser un texto' })
  licensePlate?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por disponibilidad',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'La disponibilidad debe ser verdadero o falso' })
  available?: boolean;

  @ApiPropertyOptional({
    description: 'Número de página (solo paginación)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página (solo paginación)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

