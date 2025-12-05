import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, MaxLength, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PackageItemDto } from './package-item.dto';

export enum PreorderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class UpdatePreorderDto {
  @ApiPropertyOptional({
    description: 'Dirección de origen',
    example: 'Av. Rivadavia 1000, Buenos Aires',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  origin?: string;

  @ApiPropertyOptional({
    description: 'Código postal de origen',
    example: '1033',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  originPostal?: string;

  @ApiPropertyOptional({
    description: 'Dirección de destino',
    example: 'Av. San Martín 500, Córdoba',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  destination?: string;

  @ApiPropertyOptional({
    description: 'Código postal de destino',
    example: '5000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  destinationPostal?: string;

  @ApiPropertyOptional({
    description: 'Precio final del envío',
    example: 15000.50,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Estado de la preorden',
    enum: PreorderStatus,
    example: PreorderStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(PreorderStatus)
  status?: PreorderStatus;

  @ApiPropertyOptional({
    description: 'Lista de paquetes/bultos (reemplaza los existentes)',
    type: [PackageItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  packages?: PackageItemDto[];

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Entregar en horario de oficina',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

