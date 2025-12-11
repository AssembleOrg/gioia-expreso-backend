import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ContainerStatusEnum } from './create-container.dto';

export class FilterContainerDto {
  @ApiPropertyOptional({
    description: 'Filtrar por código (búsqueda parcial)',
    example: 'CONT',
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser un texto' })
  code?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por origen (búsqueda parcial)',
    example: 'Buenos',
  })
  @IsOptional()
  @IsString({ message: 'El origen debe ser un texto' })
  origin?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por destino (búsqueda parcial)',
    example: 'Córdoba',
  })
  @IsOptional()
  @IsString({ message: 'El destino debe ser un texto' })
  destination?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: ContainerStatusEnum,
    example: ContainerStatusEnum.ON_LOAD,
  })
  @IsOptional()
  @IsEnum(ContainerStatusEnum, {
    message: 'El estado debe ser: ON_LOAD, TRAVELLING o ARRIVED',
  })
  status?: ContainerStatusEnum;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de transporte',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del transporte debe ser un UUID válido' })
  transportId?: string;

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


