import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { LIMITE_MAXIMO } from '@common/pagination';

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
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página (solo paginación)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1)
  @Max(LIMITE_MAXIMO, { message: `El límite máximo es ${LIMITE_MAXIMO}` })
  limit?: number = 10;
}


