import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PackageItemDto } from './package-item.dto';

export class CreatePreorderClientDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez García',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullname: string;

  @ApiProperty({
    description: 'Teléfono del cliente',
    example: '+54 11 1234-5678',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'cliente@email.com',
  })
  @IsString()
  email: string;

  @ApiPropertyOptional({
    description: 'CUIT del cliente',
    example: '20-12345678-9',
  })
  @IsOptional()
  @IsString()
  cuit?: string;

  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Av. Corrientes 1234, CABA',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address: string;
}

export class CreatePreorderDto {
  @ApiPropertyOptional({
    description: 'ID del cliente existente (opcional, si no se provee se usa clientData)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Datos del cliente (si no existe, se crea uno nuevo)',
    type: CreatePreorderClientDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePreorderClientDto)
  clientData?: CreatePreorderClientDto;

  @ApiProperty({
    description: 'Dirección de origen',
    example: 'Av. Rivadavia 1000, Buenos Aires',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  origin: string;

  @ApiProperty({
    description: 'Código postal de origen',
    example: '1033',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  originPostal: string;

  @ApiProperty({
    description: 'Dirección de destino',
    example: 'Av. San Martín 500, Córdoba',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  destination: string;

  @ApiProperty({
    description: 'Código postal de destino',
    example: '5000',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  destinationPostal: string;

  @ApiProperty({
    description: 'Precio final del envío',
    example: 15000.50,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Lista de paquetes/bultos',
    type: [PackageItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  packages: PackageItemDto[];

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Entregar en horario de oficina',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

