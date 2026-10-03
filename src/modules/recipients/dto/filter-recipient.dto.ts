import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LIMITE_MAXIMO } from '@common/pagination';

export class FilterRecipientDto {
  @ApiPropertyOptional({
    description:
      'Busca en nombre, DNI, teléfono y localidad (parcial, sin distinguir mayúsculas)',
    example: 'gonza',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100, { message: 'La búsqueda no puede superar los 100 caracteres' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Solo destinatarios asociados a este cliente (remitente)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID('all', { message: 'El clientId debe ser un UUID válido' })
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
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
