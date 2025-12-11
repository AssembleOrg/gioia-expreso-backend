import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';

export enum ContainerStatusEnum {
  ON_LOAD = 'ON_LOAD',
  TRAVELLING = 'TRAVELLING',
  ARRIVED = 'ARRIVED',
}

export class CreateContainerDto {
  @ApiPropertyOptional({
    description: 'Código único del contenedor (se genera automáticamente si no se proporciona)',
    example: 'CONT-2024-001',
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser un texto' })
  code?: string;

  @ApiPropertyOptional({
    description: 'ID del transporte asignado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del transporte debe ser un UUID válido' })
  transportId?: string;

  @ApiPropertyOptional({
    description: 'Estado del contenedor',
    enum: ContainerStatusEnum,
    default: ContainerStatusEnum.ON_LOAD,
    example: ContainerStatusEnum.ON_LOAD,
  })
  @IsOptional()
  @IsEnum(ContainerStatusEnum, {
    message: 'El estado debe ser: ON_LOAD, TRAVELLING o ARRIVED',
  })
  status?: ContainerStatusEnum = ContainerStatusEnum.ON_LOAD;

  @ApiProperty({
    description: 'Origen del contenedor',
    example: 'Buenos Aires',
  })
  @IsString({ message: 'El origen debe ser un texto' })
  @IsNotEmpty({ message: 'El origen es requerido' })
  origin: string;

  @ApiProperty({
    description: 'Destino del contenedor',
    example: 'Córdoba',
  })
  @IsString({ message: 'El destino debe ser un texto' })
  @IsNotEmpty({ message: 'El destino es requerido' })
  destination: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Carga frágil',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'IDs de preórdenes a incluir',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray({ message: 'Los IDs de preórdenes deben ser un array' })
  @IsUUID('4', { each: true, message: 'Cada ID de preorden debe ser un UUID válido' })
  preorderIds?: string[];
}


